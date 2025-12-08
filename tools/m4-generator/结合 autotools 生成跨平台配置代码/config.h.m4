/* 自动生成的配置头文件，请勿手动修改 */

/* 检查系统类型 */
ifdef(`OS_LINUX', `#define OS_LINUX 1', `')dnl
ifdef(`OS_MACOS', `#define OS_MACOS 1', `')dnl

/* 条件引入头文件 */
ifelse(OS_LINUX, 1,
       `#include <malloc.h>',  # Linux 用 malloc.h
       OS_MACOS, 1,
       `#include <stdlib.h>')  # macOS 用 stdlib.h

/* 定义兼容函数 */
#ifndef HAVE_GETOPT
#define getopt my_getopt  # 若系统无getopt，使用自定义实现
#endif
