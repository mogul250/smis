// Simple validation script to check frontend setup
const fs = require('fs');
const path = require('path');

console.log('🔍 Validating SMIS Frontend Setup...\n');

const requiredFiles = [
  'package.json',
  'next.config.js',
  'tailwind.config.js',
  'postcss.config.js',
  'src/pages/_app.js',
  'src/pages/login.js',
  'src/pages/dashboard.js',
  'src/components/common/Header.jsx',
  'src/components/common/Sidebar.jsx',
  'src/services/apiService.js',
  'src/context/AuthContext.jsx',
  'src/hooks/useAuth.js',
  'src/hooks/useApi.js',
  'src/styles/globals.css'
];

const requiredDirectories = [
  'src',
  'src/components',
  'src/components/common',
  'src/components/student',
  'src/components/teacher',
  'src/components/hod',
  'src/components/finance',
  'src/components/admin',
  'src/pages',
  'src/services',
  'src/context',
  'src/hooks',
  'src/styles'
];

let allValid = true;

// Check directories
console.log('📁 Checking directory structure...');
requiredDirectories.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}`);
  } else {
    console.log(`❌ ${dir} - MISSING`);
    allValid = false;
  }
});

console.log('\n📄 Checking required files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allValid = false;
  }
});

// Check package.json dependencies
console.log('\n📦 Checking package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    'next', 'react', 'react-dom', 'axios', 'tailwindcss', 
    'react-icons', 'jwt-decode'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
      allValid = false;
    }
  });
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
  allValid = false;
}

console.log('\n🎨 Checking Tailwind configuration...');
try {
  const tailwindConfig = fs.readFileSync('tailwind.config.js', 'utf8');
  if (tailwindConfig.includes('primary-blue') && tailwindConfig.includes('Inter')) {
    console.log('✅ Custom colors and fonts configured');
  } else {
    console.log('⚠️  Custom design system may not be fully configured');
  }
} catch (error) {
  console.log('❌ Error reading tailwind.config.js:', error.message);
  allValid = false;
}

console.log('\n🔐 Checking authentication setup...');
try {
  const authContext = fs.readFileSync('src/context/AuthContext.jsx', 'utf8');
  if (authContext.includes('AuthProvider') && authContext.includes('useAuth')) {
    console.log('✅ Authentication context configured');
  } else {
    console.log('❌ Authentication context incomplete');
    allValid = false;
  }
} catch (error) {
  console.log('❌ Error reading AuthContext.jsx:', error.message);
  allValid = false;
}

console.log('\n🌐 Checking API service...');
try {
  const apiService = fs.readFileSync('src/services/apiService.js', 'utf8');
  const apis = ['authAPI', 'studentAPI', 'teacherAPI', 'hodAPI', 'financeAPI', 'adminAPI'];
  let apiCount = 0;
  
  apis.forEach(api => {
    if (apiService.includes(api)) {
      apiCount++;
    }
  });
  
  if (apiCount === apis.length) {
    console.log(`✅ All ${apis.length} API services configured`);
  } else {
    console.log(`⚠️  Only ${apiCount}/${apis.length} API services found`);
  }
} catch (error) {
  console.log('❌ Error reading apiService.js:', error.message);
  allValid = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allValid) {
  console.log('🎉 SMIS Frontend setup is COMPLETE!');
  console.log('\n📋 Next steps:');
  console.log('1. Run: npm install (if not already done)');
  console.log('2. Copy .env.local.example to .env.local');
  console.log('3. Configure your API URL in .env.local');
  console.log('4. Run: npm run dev');
  console.log('5. Visit: http://localhost:3000');
} else {
  console.log('❌ Setup validation FAILED - some files are missing');
  console.log('Please check the missing files listed above.');
}
console.log('='.repeat(50));
