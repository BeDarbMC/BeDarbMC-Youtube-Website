const fs = require('fs');

const GOOGLE_YOUTUBE_API_KEY = process.env.GOOGLE_YOUTUBE_API_KEY;
const PLAYLIST_ID = 'UUryCWFTQNeFBpdxMJcee1bg'; 

// 1. Fetch the last 10 videos from your upload playlist
const PLAYLIST_URL = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${PLAYLIST_ID}&maxResults=10&key=${GOOGLE_YOUTUBE_API_KEY}`;

async function fetchLatestVideo() {
    try {
        const playlistResponse = await fetch(PLAYLIST_URL);
        if (!playlistResponse.ok) throw new Error(`Playlist API error! status: ${playlistResponse.status}`);
        const playlistData = await playlistResponse.json();
        
        if (!playlistData.items || playlistData.items.length === 0) {
            console.log('No videos found in playlist.');
            return;
        }

        // Gather the video IDs to check their details all at once
        const videoIds = playlistData.items.map(item => item.snippet.resourceId.videoId).join(',');

        // 2. Ask YouTube for the durations of all these videos
        const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${GOOGLE_YOUTUBE_API_KEY}`;
        const videoResponse = await fetch(videoDetailsUrl);
        if (!videoResponse.ok) throw new Error(`Video Details API error! status: ${videoResponse.status}`);
        const videoData = await videoResponse.json();

        let targetVideoId = null;

        // 3. Loop through the videos in their original order
      for (let i = playlistData.items.length - 1; i >= 0; i--) {
            const playlistItem = playlistData.items[i];
            const vId = playlistItem.snippet.resourceId.videoId;
            const details = videoData.items.find(v => v.id === vId);
            
            if (details) {
                const duration = details.contentDetails.duration;
                
                // Shorts are always under a minute (no M or H in the duration tag)
                const isShort = !duration.includes('M') && !duration.includes('H');

                if (!isShort) {
                    targetVideoId = vId;
                    break; // Found our absolute newest long-form video! Stop the loop.
                } else {
                    console.log(`Skipped Short: ${vId} (Duration: ${duration})`);
                }
            }
            
            if (details) {
                const duration = details.contentDetails.duration; // Example: "PT15M30S" or "PT45S"
                
                // Shorts are always less than a minute. YouTube duration strings for under a minute 
                // look like "PT45S" (no 'M' for minutes or 'H' for hours).
                const isShort = !duration.includes('M') && !duration.includes('H');

                if (!isShort) {
                    targetVideoId = vId;
                    break; // Found our newest long-form video! Stop the loop.
                } else {
                    console.log(`Skipped Short: ${vId} (Duration: ${duration})`);
                }
            }
        }

        if (targetVideoId) {
            fs.writeFileSync('latest-video.json', JSON.stringify({ videoId: targetVideoId }));
            console.log(`Successfully saved regular video ID: ${targetVideoId}`);
        } else {
            console.log('All 10 recent videos evaluated were Shorts.');
        }

    } catch (error) {
        console.error('Error handling YouTube data:', error);
        process.exit(1);
    }
}

fetchLatestVideo();
