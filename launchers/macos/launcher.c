#include <crt_externs.h>
#include <fcntl.h>
#include <libgen.h>
#include <mach-o/dyld.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>

static int exists(const char *path) {
  return access(path, F_OK) == 0;
}

static void parent_dir(char *path) {
  char *slash = strrchr(path, '/');
  if (slash && slash != path) *slash = '\0';
}

static const char *find_node(void) {
  const char *candidates[] = {
    "/opt/homebrew/bin/node",
    "/usr/local/bin/node",
    "/usr/bin/node",
    NULL
  };
  for (int i = 0; candidates[i]; i++) {
    if (exists(candidates[i])) return candidates[i];
  }
  return NULL;
}

int main(void) {
  char executable[4096];
  uint32_t size = sizeof(executable);
  if (_NSGetExecutablePath(executable, &size) != 0) return 1;
  char resolved_executable[4096];
  if (realpath(executable, resolved_executable)) {
    strncpy(executable, resolved_executable, sizeof(executable));
    executable[sizeof(executable) - 1] = '\0';
  }

  char contents[4096];
  strncpy(contents, executable, sizeof(contents));
  parent_dir(contents); // MacOS
  parent_dir(contents); // Contents

  char app_root[4096];
  snprintf(app_root, sizeof(app_root), "%s/Resources/app", contents);

  char server_path[4096];
  snprintf(server_path, sizeof(server_path), "%s/server/local-server.mjs", app_root);

  const char *node_path = find_node();

  const char *home = getenv("HOME");
  if (!home) home = "/tmp";

  char log_dir[4096];
  snprintf(log_dir, sizeof(log_dir), "%s/Library/Logs/SMART PromptCreator", home);
  mkdir(log_dir, 0755);

  char log_file[4096];
  snprintf(log_file, sizeof(log_file), "%s/launcher.log", log_dir);

  if (!exists(server_path)) {
    FILE *log = fopen(log_file, "a");
    if (log) {
      fprintf(log, "Serverdatei nicht gefunden: %s\n", server_path);
      fclose(log);
    }
    return 2;
  }

  if (!node_path) {
    FILE *log = fopen(log_file, "a");
    if (log) {
      fprintf(log, "Node.js wurde nicht gefunden.\n");
      fclose(log);
    }
    return 3;
  }

  pid_t pid = fork();
  if (pid < 0) return 4;
  if (pid > 0) return 0;

  setsid();
  signal(SIGHUP, SIG_IGN);
  chdir("/");

  int fd = open(log_file, O_WRONLY | O_CREAT | O_APPEND, 0644);
  if (fd >= 0) {
    dup2(fd, STDOUT_FILENO);
    dup2(fd, STDERR_FILENO);
  }

  setenv("SMART_OPEN_BROWSER", "1", 1);
  setenv("SMART_LOG_DIR", log_dir, 1);

  dprintf(STDOUT_FILENO, "Starting node: %s %s\n", node_path, server_path);
  char *const argv[] = {(char *)node_path, server_path, NULL};
  execve(node_path, argv, *_NSGetEnviron());
  dprintf(STDERR_FILENO, "execve failed for %s with server %s\n", node_path, server_path);
  if (fd >= 0) close(fd);
  return 5;
}
