import { PERMISSIONS } from "@/lib/auth/types"
import { RolePermissionMap } from "@/lib/auth/permissions"

function validatePermissions() {
  const valid = new Set(PERMISSIONS)

  for (const [role, permissions] of Object.entries(RolePermissionMap)) {
    for (const p of permissions) {
      if (!valid.has(p)) {
        console.error(`❌ 无效权限: ${p} (角色: ${role})`)
        process.exit(1)
      }
    }
  }

  console.log("✅ 所有角色权限合法")
}

validatePermissions()
