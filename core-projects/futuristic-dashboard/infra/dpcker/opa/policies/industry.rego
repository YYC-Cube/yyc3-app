package industry.authz

default allow = false

allow {
  input.user.role == "admin"
}

allow {
  input.user.role == "editor"
  input.resource.domain == "med"
  input.resource.sensitivity != "high"
}
