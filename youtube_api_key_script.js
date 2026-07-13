const fs = require('fs');

const GOOGLE_YOUTUBE_API_KEY = process.env.GOOGLE_YOUTUBE_API_KEY;
const PLAYLIST_ID = 'UUryCWFTQNeFBpdxMJcee1bg'; 
const URL = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${PLAYLIST_ID}&maxResults=1&key=${GOOGLE_YOUTUBE_API_KEY}`;

async function fetchLatestVideo() {
    try {
        const response = await fetch(URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            const videoId = data.items[0].snippet.resourceId.videoId;
            
            // Save just the video ID to a JSON file that the website can read
            fs.writeFileSync('latest-video.json', JSON.stringify({ videoId }));
            console.log(`Successfully fetched video ID: ${videoId}`);
        } else {
            console.log('No videos found.');
        }
    } catch (error) {
        console.error('Error fetching YouTube data:', error);
        process.exit(1);
    }
}

fetchLatestVideo();
