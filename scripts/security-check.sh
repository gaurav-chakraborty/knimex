#!/usr/bin/env bash
set -euo pipefail

failures=0

printf '%s\n' 'Security check: repository hygiene'

if git ls-files | grep -E '(^|/)(\.env($|\.)|.*\.(pem|key|p12|pfx)$)' | grep -vE '(^|/)\.env\.example$' >/tmp/filex-secret-files.txt; then
  printf '%s\n' 'ERROR: sensitive environment or key material is tracked by Git:'
  sed 's/^/  - /' /tmp/filex-secret-files.txt
  failures=$((failures + 1))
else
  printf '%s\n' 'OK: no environment or private-key files are tracked'
fi

required_patterns=(
  '^\.env$'
  '^\.env\*\.local$'
  '^\.env\.local$'
  '^\.env\.development\.local$'
  '^\.env\.test\.local$'
  '^\.env\.production\.local$'
)

for pattern in "${required_patterns[@]}"; do
  if grep -Eq "$pattern" .gitignore 2>/dev/null; then
    printf 'OK: .gitignore contains %s\n' "$pattern"
  else
    printf 'ERROR: .gitignore is missing %s\n' "$pattern"
    failures=$((failures + 1))
  fi
done

if git diff --name-only --diff-filter=ACM | grep -E '(^|/)(\.env($|\.)|.*\.(pem|key|p12|pfx)$)' | grep -vEq '(^|/)\.env\.example$'; then
  printf '%s\n' 'ERROR: sensitive files are present in the working-tree diff'
  failures=$((failures + 1))
else
  printf '%s\n' 'OK: working-tree diff contains no sensitive files'
fi

rm -f /tmp/filex-secret-files.txt

if (( failures > 0 )); then
  printf '\nSecurity check failed with %d issue(s).\n' "$failures" >&2
  exit 1
fi

printf '%s\n' 'Security check passed.'
