@@ .. @@
   useEffect(() => {
     const fetchDevelopers = async () => {
       try {
-        console.log('Fetching developers...');
         // Initial fetch of developers
         const data = await getAvailableDevelopers();
-        console.log('Fetched developers:', data);
         setDevelopers(data);

         // Subscribe to real-time updates
@@ .. @@
     const filteredDevelopers = developers.filter(developer => {
       if (!developer) return false;
 
-      console.log('Filtering developer:', developer);
-
       const searchLower = searchQuery.toLowerCase();
       const nameMatch = (developer.full_name || '').toLowerCase().includes(searchLower);