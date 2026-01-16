#!/bin/bash

# Markdown Validation Script
# Checks for common markdown formatting issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Validating markdown files..."
echo ""

# Find all markdown files
MD_FILES=$(find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/plans/*")

TOTAL_FILES=0
FILES_WITH_ISSUES=0
TOTAL_ISSUES=0

for file in $MD_FILES; do
  ((TOTAL_FILES++))

  HAS_ISSUES=false
  FILE_ISSUES=0

  # Check for duplicate code block markers
  DUPLICATES=$(awk '/^```$/{if(prev=="```")print NR-1 "-" NR; prev="```"; next} {prev=$0}' "$file")

  if [ ! -z "$DUPLICATES" ]; then
    if [ "$HAS_ISSUES" = false ]; then
      echo -e "${RED}❌ Issues found in: $file${NC}"
      HAS_ISSUES=true
      ((FILES_WITH_ISSUES++))
    fi

    echo -e "${YELLOW}  ⚠️  Duplicate code block markers:${NC}"
    echo "$DUPLICATES" | while read line; do
      echo "     Lines: $line"
      ((FILE_ISSUES++))
    done
  fi

  # Check for unclosed code blocks (odd number of ```)
  CODE_BLOCK_COUNT=$(grep -c '^```' "$file" 2>/dev/null || echo 0)
  if [ $((CODE_BLOCK_COUNT % 2)) -ne 0 ]; then
    if [ "$HAS_ISSUES" = false ]; then
      echo -e "${RED}❌ Issues found in: $file${NC}"
      HAS_ISSUES=true
      ((FILES_WITH_ISSUES++))
    fi

    echo -e "${YELLOW}  ⚠️  Unclosed code block (odd number of \`\`\` markers: $CODE_BLOCK_COUNT)${NC}"
    ((FILE_ISSUES++))
  fi

  if [ "$HAS_ISSUES" = true ]; then
    echo ""
    TOTAL_ISSUES=$((TOTAL_ISSUES + FILE_ISSUES))
  fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Validation Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Files checked: $TOTAL_FILES"
echo "Files with issues: $FILES_WITH_ISSUES"
echo "Total issues: $TOTAL_ISSUES"
echo ""

if [ $FILES_WITH_ISSUES -eq 0 ]; then
  echo -e "${GREEN}✅ All markdown files are valid!${NC}"
  exit 0
else
  echo -e "${RED}❌ Found issues in $FILES_WITH_ISSUES file(s)${NC}"
  echo ""
  echo "To fix duplicate code blocks:"
  echo "  1. Remove consecutive \`\`\` markers"
  echo "  2. Ensure one blank line between code block and text"
  echo "  3. Use 4 backticks for nested code examples"
  echo ""
  echo "Fix duplicate or unclosed code block markers before committing."
  exit 1
fi
