const GOOGLE_YOUTUBE_API_KEY = process.env.GOOGLE_YOUTUBE_API_KEY;
const PLAYLIST_ID = 'UUryCWFTQNeFBpdxMJcee1bg'; 

const PLAYLIST_URL = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${PLAYLIST_ID}&maxResults=10&key=${GOOGLE_YOUTUBE_API_KEY}`;

// Checks if YouTube natively treats this video ID as a Short page
async function checkIsShort(videoId) {
    try {
        const response = await fetch(`https://www.youtube.com/shorts/${videoId}`, { 
            method: 'HEAD',
            redirect: 'manual' // Stop it from following the redirect so we can see what YouTube does
        });
        
        // If it's a regular video, YouTube sends a 302 redirect back to the standard watch page.
        // If it's a true Short, it returns a 200 status code.
        return response.status === 200;
    } catch (error) {
        return false;
    }
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

        let targetVideoId = null;

        // Loop through your recent uploads starting from the absolute newest
        for (const playlistItem of playlistData.items) {
            const vId = playlistItem.snippet.resourceId.videoId;
            
            console.log(`Checking video: ${vId}...`);
            const isShort = await checkIsShort(vId);

            if (!isShort) {
                targetVideoId = vId;
                break; // Found the absolute newest long-form video! Stop here.
            } else {
                console.log(`Skipped Short: ${vId}`);
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
