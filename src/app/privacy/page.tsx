export default function PrivacyPage() {
    return (
        <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif', lineHeight: '1.7', color: '#333' }}>
            <h1 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Privacy Policy for 2wards</h1>
            <p><strong>Effective Date:</strong> February 7, 2026</p>

            <section>
                <h2>1. Introduction</h2>
                <p>At 2wards, we are committed to providing a seamless travel planning experience while protecting your personal data. This policy outlines how we handle information when you use our website (2wards.in) and our AI-powered travel tools.</p>
            </section>

            <section>
                <h2>2. Information We Collect</h2>
                <ul>
                    <li><strong>Authentication Data:</strong> When you sign in via Google OAuth, we collect your name, email address, and profile picture to create your personalized account.</li>
                    <li><strong>User-Generated Content:</strong> We store the trip itineraries, budget inputs, and collaboration notes you create on the platform.</li>
                    <li><strong>Technical Data:</strong> We may collect browser type, IP addresses, and device identifiers to ensure platform security and optimize your user experience.</li>
                </ul>
            </section>

            <section>
                <h2>3. How We Use Your Data</h2>
                <p>Your data is used strictly to improve your travel planning experience:</p>
                <ul>
                    <li>To sync your itineraries across multiple devices.</li>
                    <li>To provide AI-driven travel recommendations based on your preferences.</li>
                    <li>To facilitate collaboration between you and your travel companions.</li>
                    <li>To protect against unauthorized access or fraudulent activity.</li>
                </ul>
            </section>

            <section>
                <h2>4. Data Storage and Third Parties</h2>
                <p>We do not sell your data to third parties. We use trusted infrastructure providers to power our services:</p>
                <ul>
                    <li><strong>Supabase:</strong> For secure database management and encrypted user authentication.</li>
                    <li><strong>Google Cloud:</strong> For managing the OAuth sign-in flow and infrastructure.</li>
                </ul>
            </section>

            <section>
                <h2>5. Your Rights and Data Deletion</h2>
                <p>You have full control over your data. You may request to view, edit, or permanently delete your account and all associated trip data at any time by contacting our support team or using the in-app settings.</p>
            </section>

            <section>
                <h2>6. Security</h2>
                <p>We implement industry-standard SSL encryption and secure authentication protocols to protect your information. However, no method of transmission over the Internet is 100% secure, and we strive to use commercially acceptable means to protect your personal data.</p>
            </section>

            <section style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <h2>7. Contact Us</h2>
                <p>If you have questions about this Privacy Policy, please reach out to us:</p>
                <p><strong>Email:</strong> support@2wards.in</p>
                <p><strong>Website:</strong> <a href="https://www.2wards.in">www.2wards.in</a></p>
            </section>
        </div>
    );
}