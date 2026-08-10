async function run() {
  try {
    const idToDelete = "6a63540f3ebb866fb6563108"; // ID for "Test Plan Updated"
    console.log(`Deleting plan ID: ${idToDelete}...`);
    const delRes = await fetch(`http://localhost:5000/api/website/v1/pricing-plans/delete/${idToDelete}`, {
      method: 'DELETE'
    });
    const delData = await delRes.json();
    console.log('Delete status:', delRes.status, delData.message);
  } catch (error) {
    console.error('Error during deletion:', error);
  }
}

run();
