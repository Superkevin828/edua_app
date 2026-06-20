#!/bin/bash
# fix-all-links.sh

cd ~/Desktop/edua_app/frontend

echo "🔧 FIXING ALL BROKEN LINKS..."
echo ""

# ============================================
# 1. FIX CSS LINKS
# ============================================
echo "🎨 Fixing CSS links..."

# Root index.html - CSS already correct (public/css/style.css)
# No fix needed

# views/*.html - should point to ../public/css/
find views -name "*.html" -type f -exec sed -i 's|href="/css/|href="../public/css/|g' {} \;
find views -name "*.html" -type f -exec sed -i 's|href="css/|href="../public/css/|g' {} \;
find views -name "*.html" -type f -exec sed -i 's|href="../css/|href="../public/css/|g' {} \;

# views/admin/*.html - should point to ../../public/css/
find views/admin -name "*.html" -type f -exec sed -i 's|href="/css/|href="../../public/css/|g' {} \;
find views/admin -name "*.html" -type f -exec sed -i 's|href="../css/|href="../../public/css/|g' {} \;
find views/admin -name "*.html" -type f -exec sed -i 's|href="css/|href="../../public/css/|g' {} \;

echo "   ✅ CSS links fixed"

# ============================================
# 2. FIX JS LINKS
# ============================================
echo "📄 Fixing JS links..."

# Root index.html - main.js is correct (public/js/main.js)
# config.js should be js/config.js
sed -i 's|src="/js/config.js|src="js/config.js|g' index.html

# views/*.html - main.js should point to ../public/js/
find views -name "*.html" -type f -exec sed -i 's|src="/js/main.js|src="../public/js/main.js|g' {} \;
find views -name "*.html" -type f -exec sed -i 's|src="js/main.js|src="../public/js/main.js|g' {} \;

# views/*.html - dashboard.js should point to ../public/js/
find views -name "*.html" -type f -exec sed -i 's|src="/js/dashboard.js|src="../public/js/dashboard.js|g' {} \;
find views -name "*.html" -type f -exec sed -i 's|src="js/dashboard.js|src="../public/js/dashboard.js|g' {} \;

# views/*.html - auth.js should point to ../public/js/
find views -name "*.html" -type f -exec sed -i 's|src="/js/auth.js|src="../public/js/auth.js|g' {} \;
find views -name "*.html" -type f -exec sed -i 's|src="js/auth.js|src="../public/js/auth.js|g' {} \;

# views/*.html - config.js should point to ../js/
find views -name "*.html" -type f -exec sed -i 's|src="/js/config.js|src="../js/config.js|g' {} \;
find views -name "*.html" -type f -exec sed -i 's|src="js/config.js|src="../js/config.js|g' {} \;

# views/admin/*.html - should point to ../../public/js/
find views/admin -name "*.html" -type f -exec sed -i 's|src="/js/main.js|src="../../public/js/main.js|g' {} \;
find views/admin -name "*.html" -type f -exec sed -i 's|src="../js/main.js|src="../../public/js/main.js|g' {} \;
find views/admin -name "*.html" -type f -exec sed -i 's|src="js/main.js|src="../../public/js/main.js|g' {} \;

# views/admin/*.html - config.js should point to ../../js/
find views/admin -name "*.html" -type f -exec sed -i 's|src="/js/config.js|src="../../js/config.js|g' {} \;
find views/admin -name "*.html" -type f -exec sed -i 's|src="../js/config.js|src="../../js/config.js|g' {} \;
find views/admin -name "*.html" -type f -exec sed -i 's|src="js/config.js|src="../../js/config.js|g' {} \;

echo "   ✅ JS links fixed"

# ============================================
# 3. FIX IMAGE LINKS
# ============================================
echo "🖼️ Fixing image links..."

# Root index.html - images should point to public/images/
sed -i 's|src="/images/|src="public/images/|g' index.html
sed -i 's|src="images/|src="public/images/|g' index.html

# views/*.html - images should point to ../public/images/
find views -name "*.html" -type f -exec sed -i 's|src="/images/|src="../public/images/|g' {} \;
find views -name "*.html" -type f -exec sed -i 's|src="images/|src="../public/images/|g' {} \;

# views/admin/*.html - images should point to ../../public/images/
find views/admin -name "*.html" -type f -exec sed -i 's|src="/images/|src="../../public/images/|g' {} \;
find views/admin -name "*.html" -type f -exec sed -i 's|src="../images/|src="../../public/images/|g' {} \;
find views/admin -name "*.html" -type f -exec sed -i 's|src="images/|src="../../public/images/|g' {} \;

echo "   ✅ Image links fixed"

# ============================================
# 4. FIX ADMIN NAVIGATION LINKS
# ============================================
echo "🔗 Fixing admin navigation links..."

# Fix admin links in views/admin/*.html
find views/admin -name "*.html" -type f -exec sed -i 's|href="/admin/analytics|href="analytics.html|g' {} \;
find views/admin -name "*.html" -type f -exec sed -i 's|href="/admin/courses|href="courses.html|g' {} \;
find views/admin -name "*.html" -type f -exec sed -i 's|href="/admin/lessons|href="lessons.html|g' {} \;
find views/admin -name "*.html" -type f -exec sed -i 's|href="/admin/students|href="students.html|g' {} \;
find views/admin -name "*.html" -type f -exec sed -i 's|href="/admin/dashboard|href="dashboard.html|g' {} \;

echo "   ✅ Admin links fixed"

# ============================================
# 5. FIX INTERNAL PAGE LINKS
# ============================================
echo "🔗 Fixing internal page links..."

# Fix root index.html - login, signup, dashboard
sed -i 's|href="/login"|href="views/login.html"|g' index.html
sed -i 's|href="/signup"|href="views/signup.html"|g' index.html
sed -i 's|href="/dashboard"|href="views/dashboard.html"|g' index.html
sed -i 's|href="/profile"|href="views/profile.html"|g' index.html
sed -i 's|href="/course"|href="views/course.html"|g' index.html
sed -i 's|href="/admin"|href="views/admin/dashboard.html"|g' index.html

# Fix views/*.html - login, signup, dashboard
find views -name "*.html" -type f -exec sed -i 's|href="/login"|href="login.html"|g' {} \;
find views -name "*.html" -type f -exec sed -i 's|href="/signup"|href="signup.html"|g' {} \;
find views -name "*.html" -type f -exec sed -i 's|href="/dashboard"|href="dashboard.html"|g' {} \;

# Fix views/admin/*.html - login, signup, dashboard
find views/admin -name "*.html" -type f -exec sed -i 's|href="/login"|href="../login.html"|g' {} \;
find views/admin -name "*.html" -type f -exec sed -i 's|href="/signup"|href="../signup.html"|g' {} \;
find views/admin -name "*.html" -type f -exec sed -i 's|href="/dashboard"|href="../dashboard.html"|g' {} \;

echo "   ✅ Page links fixed"

# ============================================
# 6. FIX HOME LINKS
# ============================================
echo "🏠 Fixing home links..."

# views/*.html - home should point to ../index.html
find views -name "*.html" -type f -exec sed -i 's|href="/"|href="../index.html"|g' {} \;

# views/admin/*.html - home should point to ../../index.html
find views/admin -name "*.html" -type f -exec sed -i 's|href="/"|href="../../index.html"|g' {} \;
find views/admin -name "*.html" -type f -exec sed -i 's|href="../"|href="../../index.html"|g' {} \;

echo "   ✅ Home links fixed"

# ============================================
# 7. FIX LESSON LINK
# ============================================
echo "📚 Fixing lesson links..."

# Fix the dynamic lesson link
find views -name "*.html" -type f -exec sed -i 's|href="/lesson/${courseId}?l=${lesson.lessonId}|href="lesson.html?id=${courseId}&l=${lesson.lessonId}|g' {} \;

echo "   ✅ Lesson links fixed"

# ============================================
# 8. CREATE MISSING CSS FILES
# ============================================
echo "📁 Creating missing CSS files..."

# Create admin.css if missing
if [ ! -f "public/css/admin.css" ]; then
    echo "   Creating public/css/admin.css..."
    cat > public/css/admin.css << 'EOF'
/* Admin Dashboard Styles */
.admin-container {
    padding: 2rem;
}
.admin-card {
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: var(--shadow-md);
}
.admin-table {
    width: 100%;
    border-collapse: collapse;
}
.admin-table th,
.admin-table td {
    padding: 0.75rem;
    border-bottom: 1px solid var(--border-color);
    text-align: left;
}
.admin-table th {
    background: var(--bg-secondary);
    font-weight: 600;
}
EOF
fi

# Create dashboard.css if missing
if [ ! -f "public/css/dashboard.css" ]; then
    echo "   Creating public/css/dashboard.css..."
    cat > public/css/dashboard.css << 'EOF'
/* Dashboard Styles */
.dashboard-container {
    padding: 2rem 0;
}
.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
}
.dashboard-card {
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: var(--shadow-md);
    text-align: center;
}
.dashboard-card .number {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--primary);
}
.dashboard-card .label {
    color: var(--text-muted);
    font-size: 0.9rem;
}
EOF
fi

echo "   ✅ CSS files created"

# ============================================
# 9. CREATE IMAGES FOLDER AND PLACEHOLDERS
# ============================================
echo "🖼️ Creating image placeholders..."

mkdir -p public/images

# Create placeholder images if they don't exist
cd public/images

for img in hero-illustration.svg student1.jpg student2.jpg student3.jpg; do
    if [ ! -f "$img" ]; then
        echo "   Creating placeholder: $img"
        if [[ "$img" == *.svg ]]; then
            echo '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#6366f1"/><text x="200" y="200" text-anchor="middle" fill="white" font-size="24" font-family="Arial">Hero Image</text></svg>' > "$img"
        else
            # Create a simple colored square as placeholder
            convert -size 200x200 xc:"#6366f1" -fill white -gravity center -pointsize 20 -annotate 0 "Placeholder" "$img" 2>/dev/null || echo "   ⚠️ ImageMagick not installed, skipping $img"
        fi
    fi
done

cd ../..

echo "   ✅ Image placeholders created"

# ============================================
# 10. CREATE JS FOLDER AND CONFIG
# ============================================
echo "📁 Creating JS config..."

# Ensure js folder exists
mkdir -p js

# Create config.js in js folder if missing
if [ ! -f "js/config.js" ]; then
    cat > js/config.js << 'EOF'
// ============================================
// API CONFIGURATION
// ============================================

const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api'
    : 'https://your-backend.onrender.com/api';
EOF
    echo "   ✅ js/config.js created"
fi

echo ""
echo "========================================="
echo "✅ ALL LINKS FIXED!"
echo "========================================="
echo ""
echo "📁 Summary of fixes:"
echo "   ✅ CSS links fixed (public/css/)"
echo "   ✅ JS links fixed (public/js/ + js/)"
echo "   ✅ Image links fixed (public/images/)"
echo "   ✅ Admin navigation fixed"
echo "   ✅ Internal page links fixed"
echo "   ✅ Home links fixed"
echo "   ✅ Lesson links fixed"
echo "   ✅ Missing CSS files created"
echo "   ✅ Image placeholders created"
echo ""
echo "🚀 Restart your server and test!"
