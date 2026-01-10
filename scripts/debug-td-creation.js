
const API_BASE_URL = 'http://localhost:3002/api';

async function debugTDCreation() {
    console.log('🐞 Debugging Quick TD Creation...\n');

    try {
        // 1. Get a Subject ID (or create one)
        console.log('1. Fetching subjects...');
        let subjectId;
        const subjectsResponse = await fetch(`${API_BASE_URL}/subjects?level=lycee`);

        if (!subjectsResponse.ok) {
            throw new Error(`Failed to fetch subjects: ${subjectsResponse.statusText}`);
        }

        const subjectsData = await subjectsResponse.json();

        if (subjectsData.success && subjectsData.data.data && subjectsData.data.data.length > 0) {
            subjectId = subjectsData.data.data[0]._id;
            console.log(`   Found existing subject: ${subjectsData.data.data[0].name} (${subjectId})`);
        } else {
            console.log('   No subjects found. Creating a test subject...');
            const createResponse = await fetch(`${API_BASE_URL}/subjects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Debug Subject ' + Date.now(),
                    level: 'lycee',
                    category: 'mathematics',
                    description: 'A test subject for debugging'
                })
            });
            const createData = await createResponse.json();
            if (!createData.success) throw new Error('Failed to create subject: ' + JSON.stringify(createData));
            subjectId = createData.data._id;
            console.log(`   Created test subject: ${subjectId}`);
        }

        // 2. Try to create a Quick TD
        console.log('\n2. Creating Quick TD...');
        console.log('   Target Subject ID:', subjectId);

        const tdResponse = await fetch(`${API_BASE_URL}/quick-td`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subjectId: subjectId,
                title: 'Debug Quick TD ' + Date.now(),
                topic: 'Debugging Session'
            })
        });

        console.log('   Response Status:', tdResponse.status);
        const text = await tdResponse.text();
        console.log('   Raw Response:', text);

        try {
            const tdData = JSON.parse(text);
            if (tdData.success) {
                console.log('   ✅ Quick TD created successfully!');
                console.log('   ID:', tdData.data.contentId);
            } else {
                console.error('   ❌ Failed to create Quick TD');
                console.error('   Error:', tdData.error);
                console.error('   Debug Info:', tdData.debug);
            }
        } catch (e) {
            console.error('   ❌ Failed to parse response JSON');
        }

    } catch (error) {
        console.error('💥 Script Error:', error);
    }
}

debugTDCreation();
