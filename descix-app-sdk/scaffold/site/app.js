/**
 * {{APP_NAME}} - Site JavaScript
 * 
 * Add your client-side logic here.
 * 
 * For DeSciX SDK integration, use the global DeSciX object:
 * 
 * Example:
 * const stats = await DeSciX.AppData.getCommunityStats();
 * console.log('My Community Stats:', stats);
 * 
 * // Call backend API directly
 * const result = await DeSciX.call('get_app', { app_id: 'myapp' });
 */

document.addEventListener('DOMContentLoaded', async () => {
    console.log('{{APP_NAME}} site loaded');
    
    if (window.DeSciX) {
        console.log('[App] DeSciX SDK detected. Mode:', window.DeSciX.mode);
    }
});
