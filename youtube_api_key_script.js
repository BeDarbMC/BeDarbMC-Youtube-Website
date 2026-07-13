const fs = require('fs');

const GOOGLE_YOUTUBE_API_KEY = process.env.GOOGLE_YOUTUBE_API_KEY;
const PLAYLIST_ID = 'UUryCWFTQNeFBpdxMJcee1bg'; 
// Fetch 5 videos instead of 1 to ensure we find a long-form video if you uploaded Shorts recently
const URL = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${PLAYLIST_ID}&maxResults=8&key=${GOOGLE_YOUTUBE_API_KEY}`;

async function isShort(videoId) {
    try {
        // We send a quick request to the standard Shorts URL. 
        // If it redirects or fails to find a Short, YouTube treats it differently.
        const response = await fetch(`https://www.youtube.com/shorts/${videoId}`, { method: 'HEAD' });
        // YouTube redirects standard videos away from the /shorts/ URL
        return !response.url.includes('/shorts/');
    } catch (error) {
        return false;
    }
}

async function fetchLatestVideo() {
    try {
        const response = await fetch(URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            let targetVideoId = null;

            // Loop through the recent videos until we find one that isn't a Short
            for (const item of data.items) {
                const videoId = item.snippet.resourceId.videoId;
                const checkShort = await isShort(videoId);
                
                if (!checkShort) {
                    targetVideoId = videoId;
                    break; // Found the most recent regular video, stop looking
                }
                console.log(`Skipped Short: ${videoId}`);
            }

            if (targetVideoId) {
                fs.writeFileSync('latest-video.json', JSON.stringify({ videoId: targetVideoId }));
                console.log(`Successfully saved regular video ID: ${targetVideoId}`);
            } else {
                console.log('All recent videos evaluated were Shorts.');
            }
        } else {
            console.log('No videos found.');
        }
    } catch (error) {
        console.error('Error fetching YouTube data:', error);
        process.exit(1);
    }
}

fetchLatestVideo();
