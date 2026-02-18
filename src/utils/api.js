export const API_BASE_URL = 'http://localhost:8080';

export async function fetchWithAuth(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Request failed with status ${response.status}`);
    }

    // Handle empty responses (like 204 No Content)
    if (response.status === 204) return null;

    return response.json();
}

export const api = {
    login: async (email, password) => {
        return fetchWithAuth('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    listFolder: async (folderId = 'root') => {
        // If not logged in, fetch folder content as public user (no token)
        // fetchWithAuth automatically adds token if present
        return fetchWithAuth(`/folders/${folderId}`);
    },

    createFolder: async (name, parentId = 'root', isPublic = false) => {
        return fetchWithAuth('/folders', {
            method: 'POST',
            body: JSON.stringify({ name, parent_id: parentId, is_public: isPublic }),
        });
    },

    uploadFileInit: async (name, folderId, size, mimeType) => {
        return fetchWithAuth('/files/upload', {
            method: 'POST',
            body: JSON.stringify({
                name,
                folder_id: folderId,
                size,
                mime_type: mimeType,
            }),
        });
    },

    getDownloadUrl: async (fileId) => {
        return fetchWithAuth(`/files/${fileId}/download`);
    },

    // Helper to upload directly to Presigned URL
    uploadToS3: async (presignedUrl, file) => {
        return fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type,
            },
        });
    }
};
