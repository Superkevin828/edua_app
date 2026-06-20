#!/bin/bash
# check-links.sh - Check all href links in HTML files

cd ~/Desktop/edua_app/frontend

echo "========================================="
echo "     CHECKING ALL LINKS IN PROJECT"
echo "========================================="
echo ""

# ============================================
# 1. FIND ALL HTML FILES
# ============================================
echo "📁 HTML FILES FOUND:"
echo "-------------------"
find . -name "*.html" -type f | grep -v "node_modules" | sort
echo ""

# ============================================
# 2. CHECK ALL href LINKS
# ============================================
echo "📄 ALL href LINKS FOUND:"
echo "-----------------------"
grep -rh 'href="[^"]*"' --include="*.html" . | grep -v "cdnjs" | grep -v "http" | grep -v "mailto" | sed 's/.*href="//;s/".*//' | sort -u
echo ""

# ============================================
# 3. CHECK FOR BROKEN LINKS (404)
# ============================================
echo "🔍 CHECKING FOR BROKEN LINKS:"
echo "----------------------------"

# Get all unique href links (excluding external and CDN)
grep -rh 'href="[^"]*"' --include="*.html" . | grep -v "cdnjs" | grep -v "http" | grep -v "mailto" | sed 's/.*href="//;s/".*//' | sort -u | while read link; do
    # Skip empty links
    if [ -z "$link" ]; then
        continue
    fi
    
    # Skip anchor links
    if [[ "$link" == "#"* ]]; then
        continue
    fi
    
    # Determine the file path to check
    if [[ "$link" == /* ]]; then
        # Absolute path - remove leading slash
        test_path=".${link}"
    else
        test_path="$link"
    fi
    
    # Check if file exists
    found=0
    
    # Try different path variations
    if [ -f "$test_path" ]; then
        found=1
    elif [ -f "./$test_path" ]; then
        found=1
    elif [ -f "../$test_path" ]; then
        found=1
    elif [ -f "../../$test_path" ]; then
        found=1
    elif [ -f "views/$test_path" ]; then
        found=1
    elif [ -f "views/admin/$test_path" ]; then
        found=1
    elif [ -f "public/$test_path" ]; then
        found=1
    elif [ -f "js/$test_path" ]; then
        found=1
    fi
    
    if [ $found -eq 1 ]; then
        echo "   ✅ $link → FOUND"
    else
        echo "   ❌ $link → NOT FOUND"
    fi
done

echo ""

# ============================================
# 4. CHECK LINKS BY LOCATION
# ============================================
echo "📂 LINKS BY LOCATION:"
echo "--------------------"

echo ""
echo "📄 Root index.html links:"
grep -h 'href="[^"]*"' index.html 2>/dev/null | grep -v "cdnjs" | grep -v "http" | sed 's/.*href="//;s/".*//' | while read link; do
    echo "   $link"
done

echo ""
echo "📄 views/*.html links:"
grep -rh 'href="[^"]*"' views/*.html 2>/dev/null | grep -v "cdnjs" | grep -v "http" | sed 's/.*href="//;s/".*//' | sort -u | while read link; do
    echo "   $link"
done

echo ""
echo "📄 views/admin/*.html links:"
grep -rh 'href="[^"]*"' views/admin/*.html 2>/dev/null | grep -v "cdnjs" | grep -v "http" | sed 's/.*href="//;s/".*//' | sort -u | while read link; do
    echo "   $link"
done

echo ""

# ============================================
# 5. CHECK CSS LINKS
# ============================================
echo "🎨 CSS LINKS:"
echo "-------------"
grep -rh 'href="[^"]*\.css"' --include="*.html" . | sed 's/.*href="//;s/".*//' | sort -u | while read link; do
    if [[ "$link" == "https"* ]] || [[ "$link" == "http"* ]]; then
        echo "   🌐 $link (external)"
    else
        if [ -f "$link" ] || [ -f "./$link" ] || [ -f "../$link" ] || [ -f "../../$link" ]; then
            echo "   ✅ $link"
        else
            echo "   ❌ $link (MISSING)"
        fi
    fi
done

echo ""

# ============================================
# 6. CHECK JS LINKS
# ============================================
echo "📄 JS LINKS:"
echo "------------"
grep -rh 'src="[^"]*\.js"' --include="*.html" . | sed 's/.*src="//;s/".*//' | sort -u | while read link; do
    if [[ "$link" == "https"* ]] || [[ "$link" == "http"* ]]; then
        echo "   🌐 $link (external)"
    else
        if [ -f "$link" ] || [ -f "./$link" ] || [ -f "../$link" ] || [ -f "../../$link" ]; then
            echo "   ✅ $link"
        else
            echo "   ❌ $link (MISSING)"
        fi
    fi
done

echo ""

# ============================================
# 7. CHECK IMAGE LINKS
# ============================================
echo "🖼️ IMAGE LINKS:"
echo "----------------"
grep -rh 'src="[^"]*\.\(jpg\|png\|svg\|jpeg\|gif\|webp\)"' --include="*.html" . | sed 's/.*src="//;s/".*//' | sort -u | while read link; do
    if [ -f "$link" ] || [ -f "./$link" ] || [ -f "../$link" ] || [ -f "../../$link" ]; then
        echo "   ✅ $link"
    else
        echo "   ❌ $link (MISSING)"
    fi
done

echo ""

# ============================================
# 8. SUMMARY
# ============================================
echo "📊 SUMMARY:"
echo "-----------"

total_html=$(find . -name "*.html" -type f | grep -v "node_modules" | wc -l | tr -d ' ')
total_href=$(grep -rh 'href="[^"]*"' --include="*.html" . | grep -v "cdnjs" | grep -v "http" | wc -l | tr -d ' ')
total_css=$(grep -rh 'href="[^"]*\.css"' --include="*.html" . | wc -l | tr -d ' ')
total_js=$(grep -rh 'src="[^"]*\.js"' --include="*.html" . | wc -l | tr -d ' ')
total_images=$(grep -rh 'src="[^"]*\.\(jpg\|png\|svg\|jpeg\|gif\|webp\)"' --include="*.html" . | wc -l | tr -d ' ')

echo "   Total HTML files: $total_html"
echo "   Total href links: $total_href"
echo "   Total CSS links: $total_css"
echo "   Total JS links: $total_js"
echo "   Total Image links: $total_images"

echo ""
echo "========================================="
echo "            CHECK COMPLETE"
echo "========================================="
