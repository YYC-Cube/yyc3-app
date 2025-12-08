### 结合 autotools 生成跨平台配置代码
场景：C 项目需要在 Linux 和 macOS 上编译，不同系统的头文件（如 malloc.h 在 Linux 存在，macOS 用 stdlib.h）和函数（如 getopt）有差异，用 m4 配合 autoconf 生成适配代码。
#### 步骤 1：创建 m4 模板（config.h.m4）
m4
```plaintext
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

```
#### 步骤 2：通过 autoconf 调用 m4 生成 config.h
autoconf 本质是 m4 的宏集合，在 configure.ac 中定义系统检查逻辑：
m4
```plaintext
AC_INIT([myproject], [1.0])
AC_CONFIG_HEADERS([config.h])  # 指定生成config.h

# 检查操作系统
AC_CANONICAL_HOST
case $host in
  *-linux*) OS_LINUX=1 ;;
  *-darwin*) OS_MACOS=1 ;;
esac

# 检查是否有getopt函数
AC_CHECK_FUNCS([getopt])

AC_OUTPUT  # 生成config.h

```
执行 autoconf 生成 configure 脚本，再运行 ./configure 自动调用 m4 生成 config.h，适配当前系统。
优势：自动适配不同系统的差异，避免手动编写大量 #ifdef 条件编译。