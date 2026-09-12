```

# Kill port with Nushell in ubuntu
let pids = (lsof -ti :8005 | lines)
if ($pids | is-not-empty) {
  $pids | each { |pid| kill -s 9 ($pid | into int) }
}
```