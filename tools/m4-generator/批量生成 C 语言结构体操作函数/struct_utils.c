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