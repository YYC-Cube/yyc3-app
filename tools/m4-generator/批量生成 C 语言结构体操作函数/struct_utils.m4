# 定义宏：生成结构体及 get/set 函数
define(GENERATE_STRUCT, $1, $2) {  # $1:结构体名，$2:成员列表（格式：类型 变量,类型 变量...）
    typedef struct $1 {
        $2
    } $1;

    # 生成 getter 函数（如 User_get_name）
    define(GETTER, $3, $4) {
        $3 $1_get_$4($1* obj) {
            return obj->$4;
        }
    }

    # 生成 setter 函数（如 User_set_name）
    define(SETTER, $3, $4) {
        void $1_set_$4($1* obj, $3 value) {
            obj->$4 = value;
        }
    }

    # 解析成员列表，生成每个成员的 get/set 函数
    foreach(`member', split($2, ,),  # 按逗号分割成员列表
        `define(`type_var', split(member, ))dnl  # 分割类型和变量名
        GETTER($1, type_var[0], type_var[1])dnl
        SETTER($1, type_var[0], type_var[1])dnl
    ')
}dnl

# 生成 User 结构体及函数（成员：int id, char* name, int age）
GENERATE_STRUCT(User, "int id, char* name, int age")

# 生成 Order 结构体及函数（成员：int order_id, float amount, char* status）
GENERATE_STRUCT(Order, "int order_id, float amount, char* status")
