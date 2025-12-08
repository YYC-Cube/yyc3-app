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
