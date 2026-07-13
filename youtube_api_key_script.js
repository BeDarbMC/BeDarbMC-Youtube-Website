const fs = require('fs');

const GOOGLE_YOUTUBE_API_KEY = process.env.GOOGLE_YOUTUBE_API_KEY;
// Swapped to Channel ID (Starts with UC)
const CHANNEL_ID = 'UCryCWFTQNeFBpdxMJcee1bg'; 

// We tell the API: Order strictly by date, only grab standard videos (medium = 4 to 20 mins, long = 20+ mins)
const SEARCH_URL = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&order=date&type=video&videoDuration=medium&maxResults=1&key=${GOOGLE_YOUTUBE_API_KEY}`;

async function fetchLatestVideo() {
    try {
        const response = await fetch(SEARCH_URL);
        if (!response.ok) throw new Error(`Search API error! status: ${response.status}`);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            // Because we asked for order=date and videoDuration=medium, 
            // the absolute first item is guaranteed to be your newest regular video.
            const videoId = data.items[0].id.videoId;
            
            fs.writeFileSync('latest-video.json', JSON.stringify({ videoId }));
            console.log(`Successfully locked onto newest long-form video ID: ${videoId}`);
        } else {
            // If you don't have videos between 4-20 mins, try removing the duration filter 
            // and fallback to checking short format explicitly.
            console.log('No medium/long videos found with current filter.');
        }
    } catch (error) {
        console.error('Error handling YouTube Search API:', error);
        process.exit(1);
    }
}

fetchLatestVideo();
