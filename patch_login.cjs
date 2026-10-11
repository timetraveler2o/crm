const fs = require('fs');
const path = 'src/pages/Login.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add new state variables
content = content.replace(
  /const \[forgotError, setForgotError\] = useState\(''\);/,
  `const [forgotError, setForgotError] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: new password
  const [newPassword, setNewPassword] = useState('');`
);

// Update handleForgotPassword
content = content.replace(
  /const handleForgotPassword = async \(e: React\.FormEvent\) => \{[\s\S]*?setForgotLoading\(false\);\s*\};/,
  `const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    setForgotError('');
    try {
      if (resetStep === 1) {
        const res = await fetch(\`\${API_BASE_URL}/api/public/check-email\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setResetStep(2);
        } else {
          setForgotError(data.message || 'Email not found in our records.');
        }
      } else {
        if (!newPassword.trim()) {
          setForgotError('Please enter a new password');
          setForgotLoading(false);
          return;
        }
        const res = await fetch(\`\${API_BASE_URL}/api/public/reset-password\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail.trim().toLowerCase(), newPassword })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setForgotSent(true);
        } else {
          setForgotError(data.message || 'Failed to update password.');
        }
      }
    } catch {
      setForgotError('Network error. Please try again.');
    }
    setForgotLoading(false);
  };`
);

// Update UI
content = content.replace(
  /\{forgotSent \? \([\s\S]*?Back to Login\s*<\/button>\s*<\/div>\s*\) : \(/,
  `{forgotSent ? (
                <div className="text-center space-y-4">
                  <div className="bg-green-50 text-green-700 p-4 rounded-lg">
                    <p className="font-medium">Password Updated!</p>
                    <p className="text-sm mt-1">Your password has been successfully changed.</p>
                  </div>
                  <button
                    onClick={() => { setShowForgot(false); setForgotSent(false); setResetStep(1); setNewPassword(''); }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (`
);

content = content.replace(
  /<div>\s*<label className="block text-sm font-medium text-gray-700 mb-1">Email Address<\/label>\s*<input\s*type="email"\s*required\s*value=\{forgotEmail\}\s*onChange=\{\(e\) => setForgotEmail\(e\.target\.value\)\}\s*className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base"\s*placeholder="Enter your registered email"\s*\/>\s*<\/div>/,
  `{resetStep === 1 ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base"
                        placeholder="Enter your registered email"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base"
                        placeholder="Enter new password"
                      />
                    </div>
                  )}`
);

content = content.replace(
  /\{forgotLoading \? 'Sending\.\.\.' : 'Send Reset Link'\}/,
  `{forgotLoading ? 'Processing...' : (resetStep === 1 ? 'Verify Email' : 'Update Password')}`
);

content = content.replace(
  /onClick=\{\(\) => setShowForgot\(false\)\}/,
  `onClick={() => { setShowForgot(false); setResetStep(1); setNewPassword(''); }}`
);

fs.writeFileSync(path, content);
