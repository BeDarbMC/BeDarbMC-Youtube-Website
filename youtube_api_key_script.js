const fs = require('fs');

const GOOGLE_YOUTUBE_API_KEY = process.env.GOOGLE_YOUTUBE_API_KEY;
const PLAYLIST_ID = 'UUryCWFTQNeFBpdxMJcee1bg'; 

const PLAYLIST_URL = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${PLAYLIST_ID}&maxResults=10&key=${GOOGLE_YOUTUBE_API_KEY}`;

// Helper function to turn YouTube's "PT1M30S" style strings into raw total seconds
function parseISO8601Duration(durationString) {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = durationString.match(regex);
    
    const hours = parseInt(matches[1] || 0, 10);
    const minutes = parseInt(matches[2] || 0, 10);
    const seconds = parseInt(matches[3] || 0, 10);
    
    return (hours * 3600) + (minutes * 60) + seconds;
}

async function fetchLatestVideo() {
    try {
        const playlistResponse = await fetch(PLAYLIST_URL);
        if (!playlistResponse.ok) throw new Error(`Playlist API error! status: ${playlistResponse.status}`);
        const playlistData = await playlistResponse.json();
        
        if (!playlistData.items || playlistData.items.length === 0) {
            console.log('No videos found in playlist.');
            return;
        }

        const videoIds = playlistData.items.map(item => item.snippet.resourceId.videoId).join(',');

        const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${GOOGLE_YOUTUBE_API_KEY}`;
        const videoResponse = await fetch(videoDetailsUrl);
        if (!videoResponse.ok) throw new Error(`Video Details API error! status: ${videoResponse.status}`);
        const videoData = await videoResponse.json();

        let targetVideoId = null;

        // Loop forward (from absolute newest to oldest)
        for (const playlistItem of playlistData.items) {
            const vId = playlistItem.snippet.resourceId.videoId;
            const details = videoData.items.find(v => v.id === vId);
            
            if (details) {
                const durationRaw = details.contentDetails.duration;
                const totalSeconds = parseISO8601Duration(durationRaw);
                
                // If a video is 60 seconds or less, YouTube classifies it as a Short.
                const isShort = totalSeconds <= 60;

                if (!isShort) {
                    targetVideoId = vId;
                    break; // Found the absolute newest long-form video! Stop here.
                } else {
                    console.log(`Skipped Short: ${vId} (Duration: ${totalSeconds}s)`);
                }
            }
        }

        if (targetVideoId) {
            fs.writeFileSync('latest-video.json', JSON.stringify({ videoId: targetVideoId }));
            console.log(`Successfully saved regular video ID: ${targetVideoId}`);
        } else {
            console.log('All recent videos evaluated were Shorts.');
        }

    } catch (error) {
        console.error('Error handling YouTube data:', error);
        process.exit(1);
    }
}

fetchLatestVideo();
