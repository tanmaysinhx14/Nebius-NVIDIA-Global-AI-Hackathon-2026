import type { ProgrammingLanguage } from "@/lib/types";

export interface ErrorExample {
  label: string;
  language: ProgrammingLanguage;
  error: string;
  code: string;
}

export const ERROR_EXAMPLES: readonly ErrorExample[] = [
  {
    label: "Python · type error",
    language: "Python",
    error: `Traceback (most recent call last):\n  File "main.py", line 3, in <module>\n    print("Total: " + price * quantity)\nTypeError: can only concatenate str (not "int") to str`,
    code: `price = 3\nquantity = 4\nprint("Total: " + price * quantity)`,
  },
  {
    label: "JavaScript · reference error",
    language: "JavaScript",
    error: `ReferenceError: total is not defined\n    at calculateBill (checkout.js:3:3)`,
    code: `function calculateBill(items) {\n  const subtotal = items.reduce((sum, item) => sum + item.price, 0);\n  return total * 1.08;\n}`,
  },
  {
    label: "C++ · compiler error",
    language: "C++",
    error: `main.cpp: In function 'int main()':\nmain.cpp:3:3: error: expected ';' before 'return'`,
    code: `int main() {\n  int count = 3\n  return 0;\n}`,
  },
  {
    label: "Python · logic error",
    language: "Python",
    error: `AssertionError: expected 4 to be even\n  File "checks.py", line 4, in <module>\n    assert is_even(4), "expected 4 to be even"`,
    code: `def is_even(number):\n    return number % 2 == 1\n\nassert is_even(4), "expected 4 to be even"`,
  },
  {
    label: "Python · missing dependency",
    language: "Python",
    error: `ModuleNotFoundError: No module named 'requests'\n  File "status.py", line 1, in <module>\n    import requests`,
    code: `import requests\n\nresponse = requests.get("https://example.com")\nprint(response.status_code)`,
  },
];
