const https = require('https');
const http = require('http');

// Test configuration  
const API_BASE = process.argv[2] || 'http://localhost:1337';
const isHttps = API_BASE.startsWith('https');

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const protocol = isHttps ? https : http;
        const req = protocol.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = {
                        status: res.statusCode,
                        data: data ? JSON.parse(data) : null
                    };
                    resolve(result);
                } catch (error) {
                    resolve({ status: res.statusCode, data: null, error: error.message });
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

async function verifyUserIntegrity() {
    console.log('=== USER DATA INTEGRITY VERIFICATION ===');
    console.log(`API Base: ${API_BASE}`);
    
    try {
        // Get verification stats
        const statsResponse = await makeRequest(`${API_BASE}/api/debug/verification/stats`);
        
        if (statsResponse.status === 200 && statsResponse.data && statsResponse.data.stats) {
            const stats = statsResponse.data.stats;
            
            console.log('\n📊 Current User Statistics:');
            console.log(`   Total users: ${stats.totalUsers}`);
            console.log(`   Confirmed users: ${stats.confirmedUsers}`);
            console.log(`   Unconfirmed users: ${stats.unconfirmedUsers}`);
            console.log(`   Pending tokens: ${stats.pendingTokens}`);
            console.log(`   Expired tokens: ${stats.expiredTokens}`);
            console.log(`   Recent registrations: ${stats.recentRegistrations}`);
            console.log(`   Confirmation rate: ${stats.confirmationRate}%`);
            
            // Critical checks
            if (stats.totalUsers === 0) {
                console.error('❌ CRITICAL: No users found in database!');
                process.exit(1);
            }
            
            if (stats.totalUsers < 1) {
                console.error('❌ CRITICAL: User count seems too low!');
                process.exit(1);
            }
            
            // Save verification results
            const verificationResult = {
                timestamp: new Date().toISOString(),
                api_base: API_BASE,
                verification_status: 'PASSED',
                user_stats: stats,
                critical_checks: {
                    users_exist: stats.totalUsers > 0,
                    reasonable_count: stats.totalUsers >= 1,
                    api_responding: true
                }
            };
            
            console.log('\n💾 Saving verification results...');
            require('fs').writeFileSync('verification-results.json', JSON.stringify(verificationResult, null, 2));
            
            console.log('\n✅ USER DATA INTEGRITY VERIFICATION PASSED');
            
        } else {
            console.error('❌ Failed to get user statistics from API');
            console.error(`   Status: ${statsResponse.status}`);
            console.error(`   Error: ${statsResponse.error || 'Unknown'}`);
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        process.exit(1);
    }
}

verifyUserIntegrity();
