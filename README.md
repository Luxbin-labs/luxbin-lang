# LLL — LUXBIN Light Language

**LLL** (Triple L) is a modern scripting language with built-in quantum simulation and photonic encoding. It features a clean, readable syntax inspired by Lua and Python, with first-class support for quantum computing concepts.

## Installation

```bash
npm install -g luxbin-lang
```

Or clone and build from source:

```bash
git clone https://github.com/nichechristie/luxbin-lang.git
cd luxbin-lang
npm install
npm run build
npm link
```

## Quick Start

```bash
# Run a file
luxbin examples/hello.lux

# Start the REPL
luxbin repl

# Or just
luxbin
```

## Language Syntax

### Variables

```
let x = 42
const PI = 3.14159
```

### Functions

```
func greet(name)
  println("Hello, " + name + "!")
end

greet("World")
```

### Control Flow

```
if x > 0 then
  println("positive")
else if x == 0 then
  println("zero")
else
  println("negative")
end

while x > 0 do
  x = x - 1
end

for item in [1, 2, 3] do
  println(to_string(item))
end
```

### Arrays

```
let arr = [1, 2, 3, 4, 5]
push(arr, 6)
println(to_string(arr[0]))
println(to_string(len(arr)))

for i in range(10) do
  println(to_string(i))
end
```

### Imports

```
import "utils.lux"
```

### Error Handling

```
try
  let result = risky_operation()
catch err
  println("Error: " + err)
end
```

### Quantum Simulation

```
let states = superpose([0, 1, 2, 3])
let result = measure(states)
println("Collapsed to: " + to_string(result))

let flip = hadamard(0)
let pair = entangle("Alice", "Bob")
```

### Photonic Encoding

```
let wavelength = photon_wavelength("A")
let char = photon_char(wavelength)
```

### File I/O

```
fs_write("output.txt", "Hello from LLL!")
let data = fs_read("input.txt")
let exists = fs_exists("file.txt")
```

### Networking

```
let response = net_fetch_json("https://api.example.com/data")
let parsed = json_parse('{"key": "value"}')
let str = json_stringify([1, 2, 3])
```

## Built-in Functions

### I/O
| Function | Description |
|---|---|
| `print(...)` | Print values (space-separated) |
| `println(...)` | Print values with newline |
| `input(prompt)` | Read user input |

### Math
| Function | Description |
|---|---|
| `abs(x)` | Absolute value |
| `sqrt(x)` | Square root |
| `pow(x, y)` | Power |
| `sin(x)`, `cos(x)`, `tan(x)` | Trigonometry |
| `floor(x)`, `ceil(x)`, `round(x)` | Rounding |
| `min(...)`, `max(...)` | Min/max of arguments |
| `random()` | Random float [0, 1) |

### String
| Function | Description |
|---|---|
| `len(s)` | Length of string or array |
| `concat(...)` | Concatenate values |
| `slice(s, start, end)` | Substring/subarray |
| `upper(s)`, `lower(s)` | Case conversion |
| `split(s, sep)` | Split string |
| `join(arr, sep)` | Join array |
| `trim(s)` | Trim whitespace |
| `contains(s, sub)` | Check substring |
| `replace(s, old, new)` | Replace all occurrences |

### Array
| Function | Description |
|---|---|
| `push(arr, val)` | Append to array |
| `pop(arr)` | Remove and return last element |
| `sort(arr)` | Return sorted copy |
| `reverse(arr)` | Return reversed copy |
| `range(n)` / `range(start, end, step)` | Generate number array |
| `indexOf(arr, val)` | Find index of value (-1 if not found) |

### Type
| Function | Description |
|---|---|
| `to_int(x)` | Convert to integer |
| `to_float(x)` | Convert to float |
| `to_string(x)` | Convert to string |
| `to_bool(x)` | Convert to boolean |
| `type(x)` | Get type name |

### File System
| Function | Description |
|---|---|
| `fs_read(path)` | Read file contents |
| `fs_write(path, content)` | Write file |
| `fs_append(path, content)` | Append to file |
| `fs_exists(path)` | Check if path exists |
| `fs_mkdir(path)` | Create directory |
| `fs_readdir(path)` | List directory contents |
| `fs_remove(path)` | Delete file or directory |

### Networking
| Function | Description |
|---|---|
| `net_fetch(url)` | HTTP GET (returns string) |
| `net_fetch_json(url)` | HTTP GET + JSON parse |
| `json_parse(str)` | Parse JSON string |
| `json_stringify(val)` | Convert to JSON string |

### OS
| Function | Description |
|---|---|
| `os_args()` | Command-line arguments |
| `os_env(key)` | Environment variable |
| `os_exit(code)` | Exit process |
| `os_clock()` | Current time (seconds since epoch) |
| `os_sleep(ms)` | Sleep for milliseconds |
| `os_platform()` | Operating system name |
| `os_cwd()` | Current working directory |

### Quantum
| Function | Description |
|---|---|
| `superpose(states)` | Create quantum superposition |
| `measure(states)` | Collapse superposition (random) |
| `entangle(a, b)` | Create entangled pair |
| `hadamard(x)` | Hadamard gate (50/50 collapse) |
| `photon_wavelength(char)` | Map character to wavelength (nm) |
| `photon_char(wavelength)` | Map wavelength back to character |

## CLI Usage

```
luxbin run <file.lux>     Execute a .lux file
luxbin repl               Start interactive REPL
luxbin <file.lux>         Shorthand for run
luxbin --version          Print version
luxbin --help             Print usage
```

## Examples

See the `examples/` directory for sample programs:

- `hello.lux` — Hello World
- `fibonacci.lux` — Fibonacci sequence
- `quantum-rng.lux` — Quantum random number generator
- `file-io.lux` — File I/O operations
- `http-fetch.lux` — HTTP requests
- `import-demo.lux` — Module import system

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
