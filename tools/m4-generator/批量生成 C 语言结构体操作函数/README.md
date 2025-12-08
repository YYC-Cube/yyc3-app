### 案例 2：批量生成 C 语言结构体操作函数
场景：C 项目中有多个结构体（如 User、Order），每个结构体需要生成相似的 getter/setter 函数（获取 / 设置成员变量），手动编写重复且易出错。
#### 步骤 1：创建 m4 模板（struct_utils.m4）
m4
```plaintext
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

```
#### 步骤 2：生成 C 代码
bash
```bash
m4 struct_utils.m4 -o struct_utils.c
```
#### 生成结果示例（部分）
struct_utils.c 中自动生成：
c
运行
```c
typedef struct User {
    int id, char* name, int age
} User;

int User_get_id(User* obj) {
    return obj->id;
}
void User_set_id(User* obj, int value) {
    obj->id = value;
}

char* User_get_name(User* obj) {
    return obj->name;
}
void User_set_name(User* obj, char* value) {
    obj->name = value;
}
// ... 省略 age 的 get/set 函数

// Order 结构体及函数（自动生成，格式同上）
typedef struct Order {
    int order_id, float amount, char* status
} Order;
// ... 省略 Order 的 get/set 函数
```
优势：通过宏自动生成重复代码，新增结构体时只需调用 GENERATE_STRUCT 宏，减少手写错误。