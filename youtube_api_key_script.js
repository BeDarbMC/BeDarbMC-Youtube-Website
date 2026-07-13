const fs = require('fs');

const GOOGLE_YOUTUBE_API_KEY = process.env.GOOGLE_YOUTUBE_API_KEY;
const PLAYLIST_ID = 'UUryCWFTQNeFBpdxMJcee1bg'; 

// Fetch the last 10 videos from your upload playlist
const PLAYLIST_URL = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${PLAYLIST_ID}&maxResults=40&key=${GOOGLE_YOUTUBE_API_KEY}`;

// Perfect helper to parse any YouTube ISO 8601 duration safely into seconds
function parseISO8601Duration(durationString) {
    const hours = durationString.match(/(\d+)H/);
    const minutes = durationString.match(/(\d+)M/);
    const seconds = durationString.match(/(\d+)S/);

    const h = hours ? parseInt(hours[1], 10) * 3600 : 0;
    const m = minutes ? parseInt(minutes[1], 10) * 60 : 0;
    const s = seconds ? parseInt(seconds[1], 10) : 0;

    return h + m + s;
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

        // Gather the video IDs to check their details all at once
        const videoIds = playlistData.items.map(item => item.snippet.resourceId.videoId).join(',');

        // Ask YouTube for the durations of all these videos
        const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${GOOGLE_YOUTUBE_API_KEY}`;
        const videoResponse = await fetch(videoDetailsUrl);
        if (!videoResponse.ok) throw new Error(`Video Details API error! status: ${videoResponse.status}`);
        const videoData = await videoResponse.json();

        let targetVideoId = null;

        // Loop through the videos in their original order (newest first)
        for (const playlistItem of playlistData.items) {
            const vId = playlistItem.snippet.resourceId.videoId;
            const details = videoData.items.find(v => v.id === vId);
            
            if (details) {
                const durationRaw = details.contentDetails.duration;
                const totalSeconds = parseISO8601Duration(durationRaw);
                
                // YouTube strictly classifies content 60 seconds or less as a Short.
                const isShort = totalSeconds <= 180;

                if (!isShort) {
                    targetVideoId = vId;
                    break; // Found your 2-minute video! Stop the loop.
                } else {
                    console.log(`Skipped Short: ${vId} (Duration: ${totalSeconds}s)`);
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
