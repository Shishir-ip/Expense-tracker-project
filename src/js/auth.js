// ============================================================
// AUTHENTICATION MODULE - Secure Auth with Supabase
// ============================================================

let supabaseClient = null;

// Initialize Supabase client
function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase library not loaded');
        return null;
    }
    
    if (!CONFIG.SUPABASE_URL.includes('supabase.co') || CONFIG.SUPABASE_ANON_KEY.length < 20) {
        console.error('Invalid Supabase configuration');
        return null;
    }
    
    supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    return supabaseClient;
}

// ============================================================
// SIGN UP
// ============================================================
async function signUp(email, pin, name, username) {
    try {
        // Validate email (must end with @gmail.com)
        if (!email.endsWith('@gmail.com')) {
            return { error: 'Email must end with @gmail.com' };
        }
        
        // Validate PIN (6 digits)
        if (!/^\d{6}$/.test(pin)) {
            return { error: 'PIN must be exactly 6 digits' };
        }
        
        // Validate name
        if (!name || name.trim().length < 2) {
            return { error: 'Name must be at least 2 characters' };
        }
        
        // Validate username
        if (!username || username.length < 3) {
            return { error: 'Username must be at least 3 characters' };
        }
        
        const client = supabaseClient || initSupabase();
        if (!client) {
            return { error: 'Database connection not available' };
        }
        
        // Check if email already exists
        const { data: existingEmail } = await client
            .from('users')
            .select('id')
            .eq('email', email)
            .single();
            
        if (existingEmail) {
            return { error: 'Email already registered' };
        }
        
        // Check if username already exists
        const { data: existingUsername } = await client
            .from('users')
            .select('id')
            .eq('username', username.toLowerCase())
            .single();
            
        if (existingUsername) {
            return { error: 'Username already taken' };
        }
        
        // Generate OTP for email verification
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
        
        // Create user (pending verification)
        const { data: user, error } = await client
            .from('users')
            .insert({
                email: email.toLowerCase(),
                pin_hash: await hashPin(pin),
                name: name.trim(),
                username: username.toLowerCase(),
                otp_code: otp,
                otp_expiry: otpExpiry,
                is_verified: false,
                created_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (error) {
            console.error('Sign up error:', error);
            return { error: 'Failed to create account. Please try again.' };
        }
        
        // In production, send email with OTP here
        // For now, we'll store it in localStorage for demo purposes
        localStorage.setItem('pending_otp', JSON.stringify({
            email: email.toLowerCase(),
            otp: otp,
            userId: user.id
        }));
        
        // Show OTP (in production, this would be sent via email)
        console.log('Verification OTP:', otp);
        
        return { 
            success: true, 
            userId: user.id,
            email: email.toLowerCase(),
            message: 'Account created! Please verify your email with the OTP.'
        };
        
    } catch (err) {
        console.error('Sign up error:', err);
        return { error: 'An unexpected error occurred' };
    }
}

// ============================================================
// VERIFY EMAIL OTP
// ============================================================
async function verifyEmailOTP(email, otp) {
    try {
        const client = supabaseClient || initSupabase();
        if (!client) {
            return { error: 'Database connection not available' };
        }
        
        // Check pending OTP from localStorage (demo mode)
        const pendingData = localStorage.getItem('pending_otp');
        if (pendingData) {
            const pending = JSON.parse(pendingData);
            if (pending.email === email.toLowerCase() && pending.otp === otp) {
                // Mark user as verified
                const { error } = await client
                    .from('users')
                    .update({ is_verified: true, otp_code: null, otp_expiry: null })
                    .eq('email', email.toLowerCase());
                    
                if (error) {
                    return { error: 'Failed to verify email' };
                }
                
                localStorage.removeItem('pending_otp');
                return { success: true, message: 'Email verified successfully!' };
            }
        }
        
        // Database lookup
        const { data: user } = await client
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('otp_code', otp)
            .gte('otp_expiry', new Date().toISOString())
            .single();
            
        if (!user) {
            return { error: 'Invalid or expired OTP' };
        }
        
        // Mark as verified
        await client
            .from('users')
            .update({ is_verified: true, otp_code: null, otp_expiry: null })
            .eq('id', user.id);
            
        return { success: true, message: 'Email verified successfully!' };
        
    } catch (err) {
        console.error('Verify OTP error:', err);
        return { error: 'Failed to verify OTP' };
    }
}

// ============================================================
// LOGIN
// ============================================================
async function login(identifier, pin, rememberMe = false) {
    try {
        // Validate PIN format
        if (!/^\d{6}$/.test(pin)) {
            return { error: 'PIN must be exactly 6 digits' };
        }
        
        const client = supabaseClient || initSupabase();
        if (!client) {
            return { error: 'Database connection not available' };
        }
        
        // Find user by email or username
        const { data: user } = await client
            .from('users')
            .select('*')
            .or(`email.eq.${identifier.toLowerCase()},username.eq.${identifier.toLowerCase()}`)
            .eq('is_verified', true)
            .single();
            
        if (!user) {
            return { error: 'Invalid credentials' };
        }
        
        // Verify PIN
        const isValid = await verifyPin(pin, user.pin_hash);
        if (!isValid) {
            return { error: 'Invalid credentials' };
        }
        
        // Update last login
        await client
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id);
        
        // Save session
        saveSession({
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name
        }, rememberMe);
        
        return { 
            success: true, 
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                name: user.name
            },
            message: 'Login successful!'
        };
        
    } catch (err) {
        console.error('Login error:', err);
        return { error: 'Invalid credentials' };
    }
}

// ============================================================
// LOGOUT
// ============================================================
function logout() {
    clearSession();
    window.location.href = '/login';
}

// ============================================================
// FORGOT PASSWORD - REQUEST OTP
// ============================================================
async function requestPasswordReset(identifier) {
    try {
        const client = supabaseClient || initSupabase();
        if (!client) {
            return { error: 'Database connection not available' };
        }
        
        // Find user
        const { data: user } = await client
            .from('users')
            .select('*')
            .or(`email.eq.${identifier.toLowerCase()},username.eq.${identifier.toLowerCase()}`)
            .single();
            
        if (!user) {
            // Don't reveal if user exists or not for security
            return { 
                success: true, 
                message: 'If an account exists, you will receive a reset code.'
            };
        }
        
        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        
        // Store OTP
        await client
            .from('users')
            .update({ 
                reset_otp: otp,
                reset_otp_expiry: otpExpiry
            })
            .eq('id', user.id);
        
        // Store in localStorage for demo
        localStorage.setItem('reset_otp', JSON.stringify({
            email: user.email,
            otp: otp
        }));
        
        console.log('Reset OTP:', otp);
        
        return { 
            success: true, 
            message: 'If an account exists, you will receive a reset code.',
            email: user.email
        };
        
    } catch (err) {
        console.error('Password reset request error:', err);
        return { error: 'Failed to process request' };
    }
}

// ============================================================
// FORGOT PASSWORD - VERIFY OTP AND RESET
// ============================================================
async function resetPassword(identifier, otp, newPin) {
    try {
        // Validate new PIN
        if (!/^\d{6}$/.test(newPin)) {
            return { error: 'New PIN must be exactly 6 digits' };
        }
        
        const client = supabaseClient || initSupabase();
        if (!client) {
            return { error: 'Database connection not available' };
        }
        
        // Check demo mode
        const resetData = localStorage.getItem('reset_otp');
        if (resetData) {
            const reset = JSON.parse(resetData);
            const { data: user } = await client
                .from('users')
                .select('*')
                .or(`email.eq.${identifier.toLowerCase()},username.eq.${identifier.toLowerCase()}`)
                .single();
                
            if (user && reset.email === user.email && reset.otp === otp) {
                // Update PIN
                await client
                    .from('users')
                    .update({ 
                        pin_hash: await hashPin(newPin),
                        reset_otp: null,
                        reset_otp_expiry: null
                    })
                    .eq('id', user.id);
                    
                localStorage.removeItem('reset_otp');
                return { success: true, message: 'Password reset successful!' };
            }
        }
        
        // Database lookup
        const { data: user } = await client
            .from('users')
            .select('*')
            .or(`email.eq.${identifier.toLowerCase()},username.eq.${identifier.toLowerCase()}`)
            .eq('reset_otp', otp)
            .gte('reset_otp_expiry', new Date().toISOString())
            .single();
            
        if (!user) {
            return { error: 'Invalid or expired reset code' };
        }
        
        // Update PIN
        await client
            .from('users')
            .update({ 
                pin_hash: await hashPin(newPin),
                reset_otp: null,
                reset_otp_expiry: null
            })
            .eq('id', user.id);
            
        return { success: true, message: 'Password reset successful!' };
        
    } catch (err) {
        console.error('Password reset error:', err);
        return { error: 'Failed to reset password' };
    }
}

// ============================================================
// GET CURRENT USER PROFILE
// ============================================================
async function getUserProfile() {
    try {
        const session = checkSession();
        if (!session || !session.userId) {
            return null;
        }
        
        const client = supabaseClient || initSupabase();
        if (!client) {
            return null;
        }
        
        const { data: user } = await client
            .from('users')
            .select('id, email, username, name, created_at, is_verified')
            .eq('id', session.userId)
            .single();
            
        return user;
        
    } catch (err) {
        console.error('Get profile error:', err);
        return null;
    }
}

// ============================================================
// PIN HASHING (Simple hash for demo - use bcrypt in production)
// ============================================================
async function hashPin(pin) {
    // Simple hash - in production use proper bcrypt
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + 'expense_tracker_salt_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPin(pin, hash) {
    const computedHash = await hashPin(pin);
    return computedHash === hash;
}
