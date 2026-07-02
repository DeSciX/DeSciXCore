import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Box, TextField, Paper, Typography, IconButton, CircularProgress, 
  Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItem, ListItemText, Checkbox, ListItemIcon, Chip,
  Drawer, Divider, ListItemButton, ListItemSecondaryAction, Tooltip,
  Snackbar, Grid, Menu, MenuItem
} from '@mui/material';
import { marked } from 'marked';
import 'github-markdown-css/github-markdown-dark.css';
import { useAppContext } from '../AppContext';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import RestartAltIcon from '@mui/icons-material/PhonelinkErase';
import SendIcon from '@mui/icons-material/Send';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DescriptionIcon from '@mui/icons-material/Description';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import HistoryIcon from '@mui/icons-material/History';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FolderIcon from '@mui/icons-material/Folder';
import ChatIcon from '@mui/icons-material/Chat';
import PublishIcon from '@mui/icons-material/Publish';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArticleIcon from '@mui/icons-material/Article';
import VerticalSplitIcon from '@mui/icons-material/VerticalSplit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNetworkLoading } from '../util/NetworkAPI';
import { NetworkLoadingType, makeCommandRequestJSON, AppData, ProductTypes } from '../util/AppData';
import { Api } from '../util/api';
import { usePowchBridge } from '../providers/PowchBridgeProvider';

const messages = ["searching knowledgebase", "running analytics"];

const ActivityIndicator = ({ messages }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <CircularProgress />
      <Typography variant="body2" sx={{ marginTop: 1 }}>
        {messages[messageIndex]}
      </Typography>
    </Box>
  );
};

/**
 * MessageContent component to render individual chat messages
 * Includes source likes with like counts
 */
const MessageContent = ({ item, isAiResponse, onExecuteAction, onChatWithSources, onLikeSource }) => {
  const text = item.answer || item.text || item.content || '';
  const sources = item.sources || [];
  const ads = item.advertisements || [];
  const [likedSources, setLikedSources] = useState(new Set());
  
  const html = useMemo(() => marked(text), [text]);
  
  const actions = useMemo(() => {
    if (!isAiResponse) return [];
    const foundActions = [];
    const jsonRegex = /```json:call:(\w+)\s*\n([\s\S]*?)\n```/g;
    let match;
    while ((match = jsonRegex.exec(text)) !== null) {
      try {
        foundActions.push({ type: 'call', functionName: match[1], args: JSON.parse(match[2].trim()) });
      } catch (e) {}
    }
    const xmlRegex = /<action\s+name="(\w+)">([\s\S]*?)<\/action>/g;
    while ((match = xmlRegex.exec(text)) !== null) {
      try {
        foundActions.push({ type: 'tag', functionName: match[1], args: JSON.parse(match[2].trim()) });
      } catch (e) {}
    }
    return foundActions;
  }, [text, isAiResponse]);

  const handleLikeSource = async (source, e) => {
    e.stopPropagation();
    const sourceId = source.fileId || source.id || source;
    
    if (likedSources.has(sourceId)) return; // Already liked
    
    setLikedSources(prev => new Set([...prev, sourceId]));
    
    if (onLikeSource) {
      try {
        await onLikeSource(source);
      } catch (err) {
        console.error('[MessageContent] Error liking source:', err);
        setLikedSources(prev => {
          const newSet = new Set(prev);
          newSet.delete(sourceId);
          return newSet;
        });
      }
    }
  };

  return (
    <Box>
      <Box
        className="markdown-body"
        sx={{ 
          backgroundColor: 'transparent !important', 
          color: 'inherit !important',
          fontSize: '0.875rem',
          textAlign: 'left',
          '& p': { mb: 1 }
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      
      {/* Advertisements Display */}
      {isAiResponse && ads.length > 0 && (
        <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'rgba(255, 248, 225, 0.5)', border: '1px solid #ffe082', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'block', mb: 0.5 }}>
            Sponsored
          </Typography>
          {ads.map((ad, idx) => (
            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                {ad.content}
              </Typography>
              {ad.link && (
                <Button 
                  size="small" 
                  href={ad.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  sx={{ fontSize: '0.7rem', ml: 1 }}
                >
                  Learn More
                </Button>
              )}
            </Box>
          ))}
        </Box>
      )}
      
      {/* Sources Display with Likes */}
      {isAiResponse && sources.length > 0 && (
        <Box sx={{ mt: 2, pt: 1, borderTop: '1px dashed #eee' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              Sources:
            </Typography>
            <Button 
              size="small" 
              startIcon={<DescriptionIcon />} 
              onClick={() => onChatWithSources(sources)}
              sx={{ fontSize: '0.7rem' }}
            >
              Chat with Sources
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {sources.map((source, idx) => {
              const sourceId = source.fileId || source.id || source;
              const isLiked = likedSources.has(sourceId) || source.isLiked;
              const likeCount = (source.likeCount || 0) + (likedSources.has(sourceId) && !source.isLiked ? 1 : 0);
              
              return (
                <Chip 
                  key={idx} 
                  icon={<DescriptionIcon sx={{ fontSize: '14px !important' }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span>{source.fileName || sourceId}</span>
                      <IconButton 
                        size="small" 
                        onClick={(e) => handleLikeSource(source, e)}
                        sx={{ p: 0, ml: 0.5 }}
                      >
                        {isLiked ? (
                          <FavoriteIcon sx={{ fontSize: 12, color: 'error.main' }} />
                        ) : (
                          <FavoriteBorderIcon sx={{ fontSize: 12 }} />
                        )}
                      </IconButton>
                      {likeCount > 0 && (
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                          {likeCount}
                        </Typography>
                      )}
                    </Box>
                  }
                  size="small" 
                  variant="outlined" 
                  sx={{ fontSize: '0.65rem', height: 'auto', py: 0.25 }}
                  onClick={() => onChatWithSources([source])}
                />
              );
            })}
          </Box>
        </Box>
      )}

      {actions.length > 0 && onExecuteAction ? (
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {actions.map((action, idx) => (
            <Alert 
              key={idx} 
              severity="info" 
              icon={false}
              sx={{ 
                py: 0, 
                px: 1, 
                '& .MuiAlert-message': { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 } 
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                Action: {action.functionName}
              </Typography>
              <IconButton 
                size="small" 
                color="primary" 
                onClick={() => onExecuteAction(action.functionName, action.args)}
              >
                <PlayArrowIcon fontSize="small" />
                <Typography variant="button" sx={{ ml: 0.5, fontSize: '0.7rem' }}>Run</Typography>
              </IconButton>
            </Alert>
          ))}
        </Box>
      ) : actions.length > 0 ? (
        <Alert severity="warning" sx={{ mt: 1, py: 0.5 }}>
          <Typography variant="caption">
            Action detected but execution not available
          </Typography>
        </Alert>
      ) : null}
    </Box>
  );
};

// ============ DOCUMENT PANEL COMPONENT ============

const DocumentPanel = ({ docContent, docMetadata, docLoading, docPurchased, onPurchase }) => {
  if (docLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (!docPurchased && docMetadata) {
    return (
      <Box p={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            {docMetadata.name || 'Document'}
          </Typography>
          {docMetadata.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {docMetadata.description}
            </Typography>
          )}
          <Typography variant="h6" sx={{ mb: 2 }}>
            Price: {docMetadata.price > 0 ? `${docMetadata.price} USDCX` : 'Free'}
          </Typography>
          <Button variant="contained" onClick={onPurchase} disabled={docLoading}>
            {docLoading ? 'Processing...' : 'Purchase Document'}
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, height: '100%', overflow: 'auto' }} elevation={0}>
      {docMetadata && (
        <Typography variant="h5" gutterBottom>
          {docMetadata.name || 'Document'}
        </Typography>
      )}
      {docContent ? (
        <Box
          component="pre"
          sx={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            backgroundColor: 'transparent'
          }}
        >
          {docContent}
        </Box>
      ) : (
        <Typography color="text.secondary">No document content available</Typography>
      )}
    </Paper>
  );
};

// ============ CHAT PANEL COMPONENT (for split view) ============

const ChatPanel = ({ mode, selectedApp, activeThread, onExecuteAction, handleChatWithSources, handleLikeSource, responseContainerRef }) => {
  return (
    <Paper elevation={0} sx={{ flex: '1 1 auto', overflowY: 'auto', padding: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        {selectedApp ? `Chat with ${selectedApp.app_name}` : 'No app selected'}
      </Typography>
      
      {activeThread?.messages?.map((item, index) => (
        <Paper key={item.id || index} elevation={1} sx={{ marginTop: 2, padding: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Q:</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>{item.question}</Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>A:</Typography>
          <MessageContent 
            item={item} 
            isAiResponse={true} 
            onExecuteAction={onExecuteAction}
            onChatWithSources={handleChatWithSources}
            onLikeSource={handleLikeSource}
          />
        </Paper>
      ))}
      <div ref={responseContainerRef} />
    </Paper>
  );
};

// ============ THREAD STORAGE HELPERS ============

const THREADS_STORAGE_KEY = (communityId, appId) => `descix_threads_${communityId}_${appId}`;

const generateThreadId = () => `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const createNewThread = (communityId, appId) => ({
  thread_id: generateThreadId(),
  title: `Chat ${new Date().toLocaleDateString()}`,
  community_id: communityId,
  app_id: appId,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_saved: false,
  drive_file_id: null,
  messages: [],
  interaction_id: null
});

const loadThreadsFromStorage = (communityId, appId) => {
  try {
    const key = THREADS_STORAGE_KEY(communityId, appId);
    const data = localStorage.getItem(key);
    if (!data) return { active_thread_id: null, threads: {} };
    return JSON.parse(data);
  } catch (e) {
    console.error('[ChatWidget] Error loading threads:', e);
    return { active_thread_id: null, threads: {} };
  }
};

const saveThreadsToStorage = (communityId, appId, data) => {
  try {
    const key = THREADS_STORAGE_KEY(communityId, appId);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('[ChatWidget] Error saving threads:', e);
  }
};

// ============ MAIN COMPONENT ============

const ChatWidget = (props = {}) => {
  const {
    ipdocFileId,
    onExecuteAction,
    mode = 'standalone',  // standalone, embedded
    preloadedThread,
    documentId,           // IPDoc file ID for document mode
    layoutMode: initialLayoutMode = 'chat',  // chat, document, split
    // WS-HEADLESS-MVP-A4: embeddability override. The isAppOwned input gate is a
    // store-UX affordance driven by AppData.myApps, which only the platform store flow
    // populates — an EMBEDDING host app (e.g. frqtl.com) manages entitlement itself and
    // passes entitled={true}. The SERVER remains authoritative (verify_subscription +
    // credits gate on every ask_question_to_app); this only unlocks the input UI.
    entitled,             // undefined => legacy AppData.myApps check
    // WS-HEADLESS-MVP-A4: host-supplied login trigger for STANDALONE embeds (e.g. a
    // PowchClient-based host like the splitview harness / frqtl.com). When absent, the
    // widget falls back to the in-shell Powch bridge (usePowchBridge().login — the
    // PWA/SignInButton pattern, which requires a registered Powch iframe).
    onRequestLogin,
  } = props;

  const useStreaming = true;
  const { loginStatus, setCurrentView, sessionInfo } = useAppContext();
  // Inter-view state: selectedApp/selectedCommunity are read DIRECTLY from AppData —
  // the shell's viewRouter assigns them immediately before triggering the view
  // transition (PlatformViewContext.jsx '--- Update selected context ---'), and the
  // AppContext provider does NOT re-render on that transition (its mirror is
  // provider-render-stale). This is the load-bearing convention the PWA's original
  // copy of this component used; do NOT switch these to useAppContext().
  const selectedCommunity = AppData.selectedCommunity;
  const selectedApp = AppData.selectedApp;
  const powchBridge = usePowchBridge();
  const [loadingState, setNetworkLoading] = useNetworkLoading(NetworkLoadingType.GET_AI_RESPONSE);

  // Thread management state
  const [threadsData, setThreadsData] = useState({ active_thread_id: null, threads: {} });
  const [activeThread, setActiveThread] = useState(null);
  const [threadDrawerOpen, setThreadDrawerOpen] = useState(false);
  const [savedThreadsList, setSavedThreadsList] = useState([]);
  const [loadingSavedThreads, setLoadingSavedThreads] = useState(false);
  const [chatsFolderId, setChatsFolderId] = useState(null);

  // Chat state
  const [message, setMessage] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [sourcesModalOpen, setSourcesModalOpen] = useState(false);
  const [availableSources, setAvailableSources] = useState([]);
  
  // UI state
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, modified
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [layoutMode, setLayoutMode] = useState(initialLayoutMode); // chat, document, split
  
  // Document display state (IPDoc absorption)
  const [docContent, setDocContent] = useState(null);
  const [docMetadata, setDocMetadata] = useState(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docPurchased, setDocPurchased] = useState(false);
  
  // Publish modal state
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  
  const responseContainerRef = useRef(null);

  const isAppOwned = entitled !== undefined
    ? (!!entitled && !!selectedApp)
    : selectedApp && AppData.myApps?.some(
        app => app.app_id === selectedApp.app_id && app.community_id === selectedApp.community_id
      );

  const communityId = selectedApp?.community_id || selectedCommunity?.community_id;
  const appId = selectedApp?.app_id;

  // ── WS-HEADLESS-MVP-A4: AI-credits awareness ─────────────────────────────────
  // Chat is METERED (USD AI credits, one balance per user — CEO-D-2026-07-01 D2).
  // The widget shows the balance, refreshes it after every metered call (debit
  // feedback), and renders the CREDITS_REQUIRED purchasable action (buy CTA) when the
  // server rejects at zero balance. The server is authoritative — this UI is advisory.
  const [creditsBalance, setCreditsBalance] = useState(null);   // { usd_balance } | null
  const [lastDebit, setLastDebit] = useState(null);             // USD delta of last call
  const [creditsRequired, setCreditsRequired] = useState(null); // structured err.data or {}
  const [buyingCredits, setBuyingCredits] = useState(false);
  // Round 5 (CEO retest 2026-07-02): PROACTIVE purchase affordance — clicking the
  // balance chip opens the buy-credits flow (same handleBuyCredits path as the
  // CREDITS_REQUIRED CTA), instead of the CTA appearing only on the zero-balance error.
  const [buyMenuAnchor, setBuyMenuAnchor] = useState(null);
  const [signingIn, setSigningIn] = useState(false);

  // REACTIVE session from context (AppData.sessionInfo alone is a non-reactive cache —
  // reading it here would freeze the widget in its pre-login state after Powch login).
  const isAuthenticated = !!(sessionInfo?.id || sessionInfo?.user_id);

  // WS-HEADLESS-MVP-A4: the widget is "auth'd via Powch bridge" — when unauthenticated
  // it OFFERS the login instead of dead-ending on "User not authenticated".
  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      if (onRequestLogin) {
        // Standalone host owns the Powch client (PowchClient pattern).
        await onRequestLogin();
      } else if (powchBridge) {
        // In-shell path (PWA/SignInButton pattern): bridge login + session sync.
        const result = await powchBridge.login({ purpose: 'chat', registerDeSciX: true });
        if (result && window.DeSciX?.loginWithSessionToken) {
          window.DeSciX.loginWithSessionToken(result);
        }
      } else {
        throw new Error('No Powch login path available (no bridge, no onRequestLogin)');
      }
    } catch (e) {
      console.error('[ChatWidget] Powch sign-in failed:', e);
      setSnackbar({ open: true, message: `Sign-in failed: ${e.message}` });
    } finally {
      setSigningIn(false);
    }
  };

  const refreshCredits = useCallback(async ({ recordDebit = false } = {}) => {
    if (!isAuthenticated) { setCreditsBalance(null); return null; }
    try {
      const res = await makeCommandRequestJSON('get_credit_balance', {});
      const bal = res.message || res;
      setCreditsBalance(prev => {
        if (recordDebit && prev && typeof prev.usd_balance === 'number' && typeof bal.usd_balance === 'number') {
          const delta = Math.round((prev.usd_balance - bal.usd_balance) * 1e6) / 1e6;
          setLastDebit(delta > 0 ? delta : null);
        }
        return bal;
      });
      if ((bal.usd_balance ?? 0) > 0) setCreditsRequired(null);
      return bal;
    } catch (e) {
      // Balance display is advisory — never block chat UI on it (server still gates).
      console.warn('[ChatWidget] get_credit_balance failed:', e.message);
      return null;
    }
  }, [isAuthenticated]);

  useEffect(() => { refreshCredits(); }, [refreshCredits, appId]);

  // Round 5: while the CREDITS_REQUIRED alert is showing, poll the balance so a
  // purchase completed in another tab (Stripe checkout return) or a grant clears the
  // alert automatically — refreshCredits() already dismisses it once balance > 0.
  // Without this the alert deadlocks: nothing re-reads the balance until the user
  // manually asks again.
  useEffect(() => {
    if (creditsRequired === null || !isAuthenticated) return undefined;
    const t = setInterval(() => { refreshCredits(); }, 5000);
    return () => clearInterval(t);
  }, [creditsRequired, isAuthenticated, refreshCredits]);

  const handleBuyCredits = async (amountUsd) => {
    setBuyingCredits(true);
    try {
      const res = await makeCommandRequestJSON('create_stripe_checkout_session', {
        amount_usd: amountUsd,
        purchase_type: 'ai_credits',
        success_url: window.location.href,
        cancel_url: window.location.href,
      });
      const msg = res.message || res;
      // Canonical response contract: create_stripe_checkout_session returns
      // { sessionId, checkoutUrl, paymentId } (purchase.js) — the same field the
      // CLI's `descix credits buy` consumes.
      const url = msg.checkoutUrl;
      if (!url) throw new Error(`No checkout URL returned (response keys: ${Object.keys(msg).join(',')})`);
      window.open(url, '_blank', 'noopener');
      setSnackbar({ open: true, message: `Stripe checkout opened for $${amountUsd} of AI credits — your balance updates after payment.` });
    } catch (e) {
      console.error('[ChatWidget] buy credits failed:', e);
      setSnackbar({ open: true, message: `Could not start checkout: ${e.message}` });
    } finally {
      setBuyingCredits(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────────

  // Load threads from localStorage on mount or app change
  useEffect(() => {
    if (communityId && appId) {
      const data = loadThreadsFromStorage(communityId, appId);
      setThreadsData(data);
      
      // Set active thread or create new one
      if (data.active_thread_id && data.threads[data.active_thread_id]) {
        setActiveThread(data.threads[data.active_thread_id]);
      } else {
        // Create new thread
        const newThread = createNewThread(communityId, appId);
        const newData = {
          active_thread_id: newThread.thread_id,
          threads: { ...data.threads, [newThread.thread_id]: newThread }
        };
        setThreadsData(newData);
        setActiveThread(newThread);
        saveThreadsToStorage(communityId, appId, newData);
      }
    }
  }, [communityId, appId]);

  // Handle preloaded thread (from props)
  useEffect(() => {
    if (preloadedThread && communityId && appId) {
      const newThread = {
        ...preloadedThread,
        thread_id: preloadedThread.thread_id || generateThreadId(),
        community_id: communityId,
        app_id: appId
      };
      
      setThreadsData(prev => {
        const newData = {
          active_thread_id: newThread.thread_id,
          threads: { ...prev.threads, [newThread.thread_id]: newThread }
        };
        saveThreadsToStorage(communityId, appId, newData);
        return newData;
      });
      setActiveThread(newThread);
    }
  }, [preloadedThread, communityId, appId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (responseContainerRef.current?.scrollIntoView) {
      window.requestAnimationFrame(() => {
        responseContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [activeThread?.messages]);

  // Load document for document/split mode (IPDoc absorption)
  useEffect(() => {
    const loadDocument = async () => {
      const fileId = documentId || ipdocFileId;
      if (!fileId || !selectedCommunity || !selectedApp) return;
      if (layoutMode === 'chat') return; // Don't load doc in chat mode
      
      setDocLoading(true);
      try {
        // Check if user has purchased this IPDoc
        const purchasesResponse = await makeCommandRequestJSON('fetch_my_purchases', {});
        const allPurchases = purchasesResponse?.message?.purchases || [];
        const productPath = `IPDocs/${fileId}`;
        const hasPurchase = allPurchases.some(p => p.product_path === productPath);
        setDocPurchased(hasPurchase);

        if (!hasPurchase) {
          // Get product details for purchase
          const productResponse = await makeCommandRequestJSON('get_ipdoc_product', { file_id: fileId });
          if (productResponse?.status === 'OK' && productResponse?.message?.product) {
            setDocMetadata(productResponse.message.product);
          }
          setDocLoading(false);
          return;
        }

        // Load document content
        const contentResponse = await makeCommandRequestJSON('get_kb_rag_file_content', {
          community_id: selectedCommunity.community_id,
          app_id: selectedApp.app_id,
          kb_id: selectedApp.default_knowledgebase_name || 'General',
          file_path: fileId
        });

        if (contentResponse?.status === 'OK' && contentResponse?.message) {
          setDocContent(contentResponse.message.content || '');
          setDocMetadata({
            name: contentResponse.message.filePath || fileId,
            ...contentResponse.message
          });
        }

        // Log IPDoc open event
        await Api.logContentEvent({
          event_type: 'IPDOC_OPEN',
          entity_type: 'IPDOC',
          entity_id: fileId,
          community_id: selectedCommunity.community_id,
          app_id: selectedApp.app_id,
          ipdoc_file_id: fileId
        }).catch(err => console.error('Error logging IPDoc open:', err));

      } catch (err) {
        console.error('[ChatWidget] Error loading document:', err);
        setSnackbar({ open: true, message: `Error loading document: ${err.message}` });
      } finally {
        setDocLoading(false);
      }
    };

    loadDocument();
  }, [documentId, ipdocFileId, selectedCommunity, selectedApp, layoutMode]);

  // Handle document purchase
  const handlePurchaseDocument = async () => {
    const fileId = documentId || ipdocFileId;
    if (!fileId || !docMetadata) return;

    try {
      setDocLoading(true);
      const purchaseResponse = await makeCommandRequestJSON('purchase_product', {
        community_id: selectedCommunity.community_id,
        product_id: fileId,
        product_type: ProductTypes.IPDOC,
        app_id: selectedApp.app_id
      });

      if (purchaseResponse?.status === 'OK') {
        setDocPurchased(true);
        // Reload document content
        const contentResponse = await makeCommandRequestJSON('get_kb_rag_file_content', {
          community_id: selectedCommunity.community_id,
          app_id: selectedApp.app_id,
          kb_id: selectedApp.default_knowledgebase_name || 'General',
          file_path: fileId
        });

        if (contentResponse?.status === 'OK' && contentResponse?.message) {
          setDocContent(contentResponse.message.content || '');
        }
        setSnackbar({ open: true, message: 'Document purchased successfully!' });
      } else {
        throw new Error(purchaseResponse?.message || 'Purchase failed');
      }
    } catch (err) {
      console.error('[ChatWidget] Error purchasing document:', err);
      setSnackbar({ open: true, message: `Purchase failed: ${err.message}` });
    } finally {
      setDocLoading(false);
    }
  };

  // Handle source like
  const handleLikeSource = async (source) => {
    const sourceId = source.fileId || source.id || source;
    try {
      await makeCommandRequestJSON('vote_rep_on_product', {
        community_id: communityId,
        product_type: 'IPDOC',
        product_id: sourceId
      });
      setSnackbar({ open: true, message: 'Source liked!' });
    } catch (err) {
      console.error('[ChatWidget] Error liking source:', err);
      throw err;
    }
  };

  // Update active thread in storage
  const updateActiveThread = useCallback((updates) => {
    if (!activeThread || !communityId || !appId) return;
    
    const updatedThread = { 
      ...activeThread, 
      ...updates, 
      updated_at: new Date().toISOString() 
    };
    
    setActiveThread(updatedThread);
    setThreadsData(prev => {
      const newData = {
        ...prev,
        threads: { ...prev.threads, [updatedThread.thread_id]: updatedThread }
      };
      saveThreadsToStorage(communityId, appId, newData);
      return newData;
    });
    
    // Mark as modified if was saved
    if (updatedThread.is_saved) {
      setSaveStatus('modified');
    }
  }, [activeThread, communityId, appId]);

  // Load saved threads list from Drive
  const loadSavedThreadsList = useCallback(async () => {
    if (!communityId || !appId) return;
    
    setLoadingSavedThreads(true);
    try {
      const response = await makeCommandRequestJSON('list_saved_threads', {
        community_id: communityId,
        app_id: appId
      });
      
      if (response.status === 'OK' || response.threads) {
        setSavedThreadsList(response.threads || []);
        if (response.folder_id) {
          setChatsFolderId(response.folder_id);
        }
      }
    } catch (error) {
      console.error('[ChatWidget] Error loading saved threads:', error);
    } finally {
      setLoadingSavedThreads(false);
    }
  }, [communityId, appId]);

  // Load when drawer opens
  useEffect(() => {
    if (threadDrawerOpen) {
      loadSavedThreadsList();
    }
  }, [threadDrawerOpen, loadSavedThreadsList]);

  // Create new thread
  const handleNewThread = useCallback(() => {
    if (!communityId || !appId) return;
    
    const newThread = createNewThread(communityId, appId);
    setThreadsData(prev => {
      const newData = {
        active_thread_id: newThread.thread_id,
        threads: { ...prev.threads, [newThread.thread_id]: newThread }
      };
      saveThreadsToStorage(communityId, appId, newData);
      return newData;
    });
    setActiveThread(newThread);
    setSaveStatus('idle');
    setSnackbar({ open: true, message: 'New chat started' });
  }, [communityId, appId]);

  // Save thread to Drive
  const handleSaveThread = useCallback(async () => {
    if (!activeThread || !communityId || !appId) return;
    
    setSaveStatus('saving');
    try {
      // Convert messages to the format expected by backend
      const threadJson = {
        ...activeThread,
        messages: activeThread.messages.map(msg => ({
          id: msg.id,
          role: msg.role || (msg.question ? 'user' : 'assistant'),
          content: msg.content || msg.question || msg.answer || msg.text,
          sources: msg.sources,
          timestamp: msg.timestamp
        }))
      };
      
      // Flatten Q&A pairs if needed
      const flatMessages = [];
      for (const msg of activeThread.messages) {
        if (msg.question) {
          flatMessages.push({ id: `${msg.id}_q`, role: 'user', content: msg.question, timestamp: msg.timestamp });
        }
        if (msg.answer || msg.text) {
          flatMessages.push({ id: `${msg.id}_a`, role: 'assistant', content: msg.answer || msg.text, sources: msg.sources, timestamp: msg.timestamp });
        }
        if (msg.content && msg.role) {
          flatMessages.push(msg);
        }
      }
      
      const response = await makeCommandRequestJSON('save_chat_thread', {
        thread_json: { ...threadJson, messages: flatMessages },
        community_id: communityId,
        app_id: appId,
        title: activeThread.title
      });
      
      if (response.status === 'OK' || response.drive_file_id) {
        updateActiveThread({ 
          is_saved: true, 
          drive_file_id: response.drive_file_id 
        });
        setSaveStatus('saved');
        setSnackbar({ open: true, message: 'Chat saved to Drive' });
        loadSavedThreadsList(); // Refresh list
      } else {
        throw new Error(response.error || 'Failed to save');
      }
    } catch (error) {
      console.error('[ChatWidget] Error saving thread:', error);
      setSaveStatus('idle');
      setSnackbar({ open: true, message: `Save failed: ${error.message}` });
    }
  }, [activeThread, communityId, appId, updateActiveThread, loadSavedThreadsList]);

  // Handle publish (save and redirect to My Content)
  const handlePublish = useCallback(async () => {
    if (!activeThread?.messages?.length) {
      setSnackbar({ open: true, message: 'Nothing to publish' });
      return;
    }

    // First save the thread
    await handleSaveThread();
    
    // Show modal with next steps
    setPublishModalOpen(true);
  }, [activeThread, handleSaveThread]);

  // Load thread from Drive
  const handleLoadThread = useCallback(async (fileId) => {
    if (!communityId || !appId) return;
    
    try {
      const response = await makeCommandRequestJSON('load_saved_thread', {
        drive_file_id: fileId
      });
      
      if (response.status === 'OK' || response.thread_json) {
        const loadedThread = response.thread_json;
        loadedThread.thread_id = loadedThread.thread_id || generateThreadId();
        loadedThread.community_id = communityId;
        loadedThread.app_id = appId;
        
        // Convert messages back to Q&A format
        const messages = [];
        let currentPair = null;
        
        for (const msg of (loadedThread.messages || [])) {
          if (msg.role === 'user') {
            if (currentPair) messages.push(currentPair);
            currentPair = { 
              id: msg.id || generateThreadId(), 
              question: msg.content, 
              answer: '', 
              sources: [], 
              timestamp: msg.timestamp 
            };
          } else if (msg.role === 'assistant' && currentPair) {
            currentPair.answer = msg.content;
            currentPair.sources = msg.sources || [];
          }
        }
        if (currentPair) messages.push(currentPair);
        
        loadedThread.messages = messages;
        
        setThreadsData(prev => {
          const newData = {
            active_thread_id: loadedThread.thread_id,
            threads: { ...prev.threads, [loadedThread.thread_id]: loadedThread }
          };
          saveThreadsToStorage(communityId, appId, newData);
          return newData;
        });
        setActiveThread(loadedThread);
        setSaveStatus('saved');
        setThreadDrawerOpen(false);
        setSnackbar({ open: true, message: 'Chat loaded from Drive' });
      }
    } catch (error) {
      console.error('[ChatWidget] Error loading thread:', error);
      setSnackbar({ open: true, message: `Load failed: ${error.message}` });
    }
  }, [communityId, appId]);

  // Switch to a local thread
  const handleSwitchThread = useCallback((threadId) => {
    if (!threadsData.threads[threadId]) return;
    
    const thread = threadsData.threads[threadId];
    setActiveThread(thread);
    setThreadsData(prev => {
      const newData = { ...prev, active_thread_id: threadId };
      saveThreadsToStorage(communityId, appId, newData);
      return newData;
    });
    setSaveStatus(thread.is_saved ? 'saved' : 'idle');
    setThreadDrawerOpen(false);
  }, [threadsData, communityId, appId]);

  // Delete local thread
  const handleDeleteLocalThread = useCallback((threadId) => {
    if (!communityId || !appId) return;
    
    setThreadsData(prev => {
      const newThreads = { ...prev.threads };
      delete newThreads[threadId];
      
      let newActiveId = prev.active_thread_id;
      if (newActiveId === threadId) {
        const remainingIds = Object.keys(newThreads);
        newActiveId = remainingIds.length > 0 ? remainingIds[0] : null;
      }
      
      const newData = { active_thread_id: newActiveId, threads: newThreads };
      saveThreadsToStorage(communityId, appId, newData);
      
      if (newActiveId && newThreads[newActiveId]) {
        setActiveThread(newThreads[newActiveId]);
      } else {
        // Create new thread if none left
        const newThread = createNewThread(communityId, appId);
        newData.active_thread_id = newThread.thread_id;
        newData.threads[newThread.thread_id] = newThread;
        saveThreadsToStorage(communityId, appId, newData);
        setActiveThread(newThread);
      }
      
      return newData;
    });
    
    setSnackbar({ open: true, message: 'Chat deleted' });
  }, [communityId, appId]);

  // Submit message
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp || !activeThread) return;

    setNetworkLoading(NetworkLoadingType.GET_AI_RESPONSE, true, 'Fetching AI response...');
    try {
      const params = { 
        community_id: communityId, 
        user_input: message,
        app_id: appId, 
        streaming: useStreaming,
        previous_interaction_id: activeThread.interaction_id,
        doc_ids: selectedDocIds,
        ipdoc_file_id: ipdocFileId || (selectedCommunity?.googleDocId || null)
      };
      
      setSelectedDocIds([]);
      const newMessageId = `msg_${Date.now()}`;
      const newMessage = { 
        id: newMessageId, 
        question: message, 
        answer: '', 
        sources: [], 
        checked: false,
        timestamp: new Date().toISOString()
      };
      
      updateActiveThread({ 
        messages: [...activeThread.messages, newMessage] 
      });
      setMessage('');

      if (useStreaming) {
        const streamGenerator = await makeCommandRequestJSON('ask_question_to_app', params);
        let accumulatedResponse = '';
        let finalSources = [];
        let finalAds = [];
        let finalInteractionId = activeThread.interaction_id;
        
        for await (const chunk of streamGenerator) {
          if (chunk.reply) {
            accumulatedResponse += chunk.reply;
            setActiveThread(prev => {
              const updatedMessages = [...prev.messages];
              const lastIdx = updatedMessages.length - 1;
              if (lastIdx >= 0) {
                updatedMessages[lastIdx] = { 
                  ...updatedMessages[lastIdx], 
                  answer: accumulatedResponse 
                };
              }
              return { ...prev, messages: updatedMessages };
            });
          }
          if (chunk.interaction_id) {
            finalInteractionId = chunk.interaction_id;
          }
          if (chunk.sources) {
            finalSources = chunk.sources;
          }
          if (chunk.advertisements) {
            finalAds = chunk.advertisements;
          }
        }
        
        // Final update with all data
        setActiveThread(prev => {
          const finalMessages = [...prev.messages];
          const lastIdx = finalMessages.length - 1;
          if (lastIdx >= 0) {
            finalMessages[lastIdx] = { 
              ...finalMessages[lastIdx], 
              answer: accumulatedResponse,
              sources: finalSources,
              advertisements: finalAds,
              checked: true 
            };
          }
          
          const updatedThread = { 
            ...prev, 
            messages: finalMessages,
            interaction_id: finalInteractionId,
            updated_at: new Date().toISOString() 
          };
          
          // Persist to localStorage
          setThreadsData(threadsPrev => {
            const newData = {
              ...threadsPrev,
              threads: { ...threadsPrev.threads, [updatedThread.thread_id]: updatedThread }
            };
            saveThreadsToStorage(communityId, appId, newData);
            return newData;
          });
          
          // Mark as modified if was saved
          if (updatedThread.is_saved) {
            setSaveStatus('modified');
          }
          
          return updatedThread;
        });
      } else {
        const response = await makeCommandRequestJSON('ask_question_to_app', params);
        const result = response.message || response;
        
        setActiveThread(prev => {
          const finalMessages = [...prev.messages];
          const lastIdx = finalMessages.length - 1;
          if (lastIdx >= 0) {
            finalMessages[lastIdx] = { 
              ...finalMessages[lastIdx], 
              answer: result.response || result.text,
              sources: result.sources || [],
              advertisements: result.advertisements || [],
              checked: true 
            };
          }
          return {
            ...prev,
            messages: finalMessages,
            interaction_id: result.interaction_id || prev.interaction_id
          };
        });
      }
      // WS-HEADLESS-MVP-A4: debit feedback — the metered call just debited actual usage;
      // refresh the balance and record the delta for the credits bar.
      refreshCredits({ recordDebit: true });
    } catch (error) {
      console.error('Chat Error:', error);
      // WS-HEADLESS-MVP-A4: never swallow a chat failure silently (pre-A4 this catch
      // only logged). Render the error into the thread, and if it is the structured
      // CREDITS_REQUIRED purchasable-action error, surface the buy CTA.
      const isCreditsRequired = error?.code === 'CREDITS_REQUIRED' || /CREDITS_REQUIRED/.test(error?.message || '');
      if (isCreditsRequired) {
        setCreditsRequired(error?.data || {});
        refreshCredits();
      }
      setActiveThread(prev => {
        if (!prev) return prev;
        const msgs = [...prev.messages];
        const lastIdx = msgs.length - 1;
        if (lastIdx >= 0 && !msgs[lastIdx].answer) {
          msgs[lastIdx] = {
            ...msgs[lastIdx],
            answer: isCreditsRequired
              ? '**Out of AI credits.** This chat is metered — buy credits below to continue.'
              : `**Error:** ${error.message}`,
            error: true,
            checked: true,
          };
        }
        return { ...prev, messages: msgs };
      });
    } finally {
      setNetworkLoading(NetworkLoadingType.GET_AI_RESPONSE, false);
    }
  };

  const handleChatWithSources = (sources) => {
    setAvailableSources(sources);
    setSourcesModalOpen(true);
  };

  const handleToggleSource = (id) => {
    setSelectedDocIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleResetChat = () => {
    if (!activeThread) return;
    setActiveThread(prev => ({
      ...prev,
      messages: [], 
      interaction_id: null,
      is_saved: false,
      drive_file_id: null,
      updated_at: new Date().toISOString()
    }));
    setSaveStatus('idle');
  };

  // Get save button icon and tooltip
  const getSaveButtonProps = () => {
    switch (saveStatus) {
      case 'saving':
        return { icon: <CircularProgress size={20} />, tooltip: 'Saving...', disabled: true };
      case 'saved':
        return { icon: <CloudDoneIcon />, tooltip: 'Saved to Drive', disabled: false };
      case 'modified':
        return { icon: <CloudUploadIcon color="warning" />, tooltip: 'Unsaved changes', disabled: false };
      default:
        return { icon: <SaveIcon />, tooltip: 'Save to Drive', disabled: false };
    }
  };

  const saveButtonProps = getSaveButtonProps();
  const localThreads = Object.values(threadsData.threads).filter(t => !t.is_saved || t.thread_id === activeThread?.thread_id);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: mode === 'embedded' ? '100%' : '90vh' }}>
      {/* Header with thread controls */}
      <Paper elevation={mode === 'embedded' ? 0 : 1} sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Tooltip title="Chat History">
          <IconButton onClick={() => setThreadDrawerOpen(true)} size="small">
            <HistoryIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="New Chat">
          <span>
            <IconButton onClick={handleNewThread} size="small" color="primary">
              <AddCircleIcon />
            </IconButton>
          </span>
        </Tooltip>
        
        <Tooltip title={saveButtonProps.tooltip}>
          <span>
            <IconButton 
              onClick={handleSaveThread} 
              size="small" 
              disabled={saveButtonProps.disabled || !activeThread?.messages?.length}
            >
              {saveButtonProps.icon}
            </IconButton>
          </span>
        </Tooltip>
        
        <Tooltip title="Publish to Community">
          <span>
            <IconButton 
              onClick={handlePublish} 
              size="small" 
              color="secondary"
              disabled={!activeThread?.messages?.length}
            >
              <PublishIcon />
            </IconButton>
          </span>
        </Tooltip>
        
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        
        {/* Layout mode toggle */}
        {(documentId || ipdocFileId) && (
          <>
            <Tooltip title="Chat View">
              <IconButton 
                onClick={() => setLayoutMode('chat')} 
                size="small"
                color={layoutMode === 'chat' ? 'primary' : 'default'}
              >
                <ChatIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Split View">
              <IconButton 
                onClick={() => setLayoutMode('split')} 
                size="small"
                color={layoutMode === 'split' ? 'primary' : 'default'}
              >
                <VerticalSplitIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Document View">
              <IconButton 
                onClick={() => setLayoutMode('document')} 
                size="small"
                color={layoutMode === 'document' ? 'primary' : 'default'}
              >
                <ArticleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          </>
        )}
        
        <Typography variant="subtitle2" sx={{ flex: 1, ml: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activeThread?.title || 'New Chat'}
          {activeThread?.is_saved && <CloudDoneIcon sx={{ ml: 0.5, fontSize: 14, verticalAlign: 'middle', color: 'success.main' }} />}
        </Typography>
        
        <Tooltip title="Clear Chat">
          <span>
            <IconButton onClick={handleResetChat} size="small" disabled={!activeThread?.messages?.length}>
              <RestartAltIcon />
            </IconButton>
          </span>
        </Tooltip>

        {chatsFolderId && (
          <Tooltip title="Open Chats Folder in Drive">
            <IconButton 
              href={`https://drive.google.com/drive/u/0/folders/${chatsFolderId}`}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Paper>

      {/* Main content area - supports chat, document, and split layouts */}
      {layoutMode === 'split' ? (
        <Grid container sx={{ flex: '1 1 auto', overflow: 'hidden' }}>
          {/* Document Panel */}
          <Grid item xs={12} md={6} sx={{ height: '100%', overflow: 'auto', borderRight: 1, borderColor: 'divider' }}>
            <DocumentPanel 
              docContent={docContent}
              docMetadata={docMetadata}
              docLoading={docLoading}
              docPurchased={docPurchased}
              onPurchase={handlePurchaseDocument}
            />
          </Grid>
          {/* Chat Panel */}
          <Grid item xs={12} md={6} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <ChatPanel 
              mode={mode}
              selectedApp={selectedApp}
              activeThread={activeThread}
              onExecuteAction={onExecuteAction}
              handleChatWithSources={handleChatWithSources}
              handleLikeSource={handleLikeSource}
              responseContainerRef={responseContainerRef}
            />
          </Grid>
        </Grid>
      ) : layoutMode === 'document' ? (
        <Box sx={{ flex: '1 1 auto', overflow: 'auto' }}>
          <DocumentPanel 
            docContent={docContent}
            docMetadata={docMetadata}
            docLoading={docLoading}
            docPurchased={docPurchased}
            onPurchase={handlePurchaseDocument}
          />
        </Box>
      ) : (
        <Paper elevation={mode === 'embedded' ? 0 : 3} sx={{ flex: '1 1 auto', overflowY: 'auto', padding: 2 }}>
          <Typography variant={mode === 'embedded' ? 'subtitle2' : 'h6'} gutterBottom>
            {selectedApp ? `Chat with ${selectedApp.app_name}` : 'No app selected'}
          </Typography>
          
          {activeThread?.messages?.map((item, index) => (
            <Paper key={item.id || index} elevation={1} sx={{ marginTop: 2, padding: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Question:</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>{item.question}</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Answer:</Typography>
              <MessageContent 
                item={item} 
                isAiResponse={true} 
                onExecuteAction={onExecuteAction}
                onChatWithSources={handleChatWithSources}
                onLikeSource={handleLikeSource}
              />
            </Paper>
          ))}
          <div ref={responseContainerRef} />
        </Paper>
      )}

      {/* Selected sources indicator */}
      {selectedDocIds.length > 0 && (
        <Box sx={{ px: 2, py: 1, backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Context:</Typography>
          {selectedDocIds.map(id => (
            <Chip key={id} label={id} size="small" onDelete={() => handleToggleSource(id)} sx={{ height: '20px', fontSize: '0.65rem' }} />
          ))}
        </Box>
      )}

      {/* WS-HEADLESS-MVP-A4: Powch sign-in affordance — chat is auth'd via Powch */}
      {!isAuthenticated && (
        <Alert
          severity="info"
          data-testid="chat-signin-alert"
          sx={{ mx: 2, mt: 1, alignItems: 'center' }}
          action={
            <Button
              size="small"
              variant="contained"
              disabled={signingIn}
              onClick={handleSignIn}
              data-testid="chat-signin-button"
            >
              {signingIn ? 'Signing in…' : 'Sign in with Powch'}
            </Button>
          }
        >
          Sign in to chat — AI chat runs on your DeSciX account (metered AI credits).
        </Alert>
      )}

      {/* WS-HEADLESS-MVP-A4: AI-credits bar — balance, debit feedback, buy CTA */}
      {creditsRequired !== null && (
        <Alert
          severity="warning"
          data-testid="credits-required-alert"
          sx={{ mx: 2, mt: 1, alignItems: 'center' }}
          action={
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {[5, 10, 20].map(amt => (
                <Button
                  key={amt}
                  size="small"
                  variant={amt === 10 ? 'contained' : 'outlined'}
                  color="warning"
                  disabled={buyingCredits}
                  onClick={() => handleBuyCredits(amt)}
                  data-testid={`buy-credits-${amt}`}
                >
                  ${amt}
                </Button>
              ))}
            </Box>
          }
        >
          You&apos;re out of AI credits{creditsBalance ? ` (balance $${(creditsBalance.usd_balance ?? 0).toFixed(2)})` : ''}.
          Buy credits to continue chatting.
        </Alert>
      )}
      {isAuthenticated && creditsBalance && creditsRequired === null && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, px: 2, pt: 1 }}>
          <Tooltip title="Signed in via Powch">
            <Chip
              size="small"
              variant="outlined"
              color="success"
              data-testid="chat-user-chip"
              label={sessionInfo?.email || sessionInfo?.id || sessionInfo?.user_id}
            />
          </Tooltip>
          {lastDebit !== null && (
            <Typography variant="caption" color="text.secondary" data-testid="credits-last-debit">
              −${lastDebit.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')}
            </Typography>
          )}
          <Tooltip title="AI chat is metered against your platform-wide USD credits balance. Click to buy credits or refresh.">
            <Chip
              size="small"
              variant="outlined"
              data-testid="credits-balance-chip"
              label={`AI credits: $${(creditsBalance.usd_balance ?? 0).toFixed(4)}`}
              onClick={(e) => { setBuyMenuAnchor(e.currentTarget); refreshCredits(); }}
            />
          </Tooltip>
          {/* Round 5: proactive buy-credits flow from the chip (CEO retest 2026-07-02).
              Same purchase path as the zero-balance CTA — handleBuyCredits ->
              create_stripe_checkout_session (purchase_type: ai_credits) -> window.open. */}
          <Menu
            anchorEl={buyMenuAnchor}
            open={!!buyMenuAnchor}
            onClose={() => setBuyMenuAnchor(null)}
            data-testid="credits-buy-menu"
          >
            {[5, 10, 20].map(amt => (
              <MenuItem
                key={amt}
                disabled={buyingCredits}
                data-testid={`chip-buy-credits-${amt}`}
                onClick={() => { setBuyMenuAnchor(null); handleBuyCredits(amt); }}
              >
                Buy ${amt} AI credits
              </MenuItem>
            ))}
            <Divider />
            <MenuItem
              data-testid="chip-refresh-balance"
              onClick={() => { setBuyMenuAnchor(null); refreshCredits(); }}
            >
              Refresh balance
            </MenuItem>
          </Menu>
        </Box>
      )}

      {/* Input area */}
      <Box component="form" onSubmit={handleSubmit} sx={{ padding: 2, borderTop: '1px solid #ccc' }}>
        {loadingState.loading ? (
          <ActivityIndicator messages={messages} />
        ) : (
          <Box sx={{ position: 'relative' }}>
            <TextField
              fullWidth
              label={!isAuthenticated ? 'Sign in to chat' : (isAppOwned ? 'Ask a question' : 'Purchase required')}
              variant="outlined"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              multiline
              minRows={4}
              disabled={!isAppOwned || !isAuthenticated}
            />
            <IconButton type="submit" color="primary" disabled={!isAppOwned || !isAuthenticated || !message.trim()} sx={{ position: 'absolute', top: '8px', right: '8px' }}>
              <SendIcon />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Thread Drawer */}
      <Drawer
        anchor="left"
        open={threadDrawerOpen}
        onClose={() => setThreadDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: 300 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            <HistoryIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Chat History
          </Typography>
        </Box>
        <Divider />
        
        {/* Local/Unsaved Threads */}
        <Box sx={{ p: 1 }}>
          <Typography variant="caption" sx={{ px: 1, fontWeight: 'bold', color: 'text.secondary' }}>
            Current Session
          </Typography>
          <List dense>
            {localThreads.map(thread => (
              <ListItemButton 
                key={thread.thread_id}
                selected={thread.thread_id === activeThread?.thread_id}
                onClick={() => handleSwitchThread(thread.thread_id)}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ChatIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={thread.title}
                  secondary={`${thread.messages?.length || 0} messages`}
                  primaryTypographyProps={{ noWrap: true, variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    size="small"
                    onClick={(e) => { e.stopPropagation(); handleDeleteLocalThread(thread.thread_id); }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItemButton>
            ))}
          </List>
        </Box>
        
        <Divider />
        
        {/* Saved Threads from Drive */}
        <Box sx={{ p: 1 }}>
          <Typography variant="caption" sx={{ px: 1, fontWeight: 'bold', color: 'text.secondary' }}>
            Saved to Drive
          </Typography>
          {loadingSavedThreads ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : savedThreadsList.length === 0 ? (
            <Typography variant="body2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
              No saved chats
            </Typography>
          ) : (
            <List dense>
              {savedThreadsList.map(thread => (
                <ListItemButton 
                  key={thread.file_id}
                  onClick={() => handleLoadThread(thread.file_id)}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <FolderIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={thread.title}
                    secondary={thread.updated_at ? new Date(thread.updated_at).toLocaleDateString() : ''}
                    primaryTypographyProps={{ noWrap: true, variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      </Drawer>

      {/* Sources Selection Modal */}
      <Dialog open={sourcesModalOpen} onClose={() => setSourcesModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Sources</DialogTitle>
        <DialogContent>
          <List>
            {availableSources.map((source, idx) => {
              const id = source.fileId || source.id || source.fileName || source;
              return (
                <ListItem key={idx} button onClick={() => handleToggleSource(id)}>
                  <ListItemIcon><Checkbox checked={selectedDocIds.includes(id)} /></ListItemIcon>
                  <ListItemText primary={source.fileName || id} secondary={source.score ? `Score: ${source.score.toFixed(3)}` : null} />
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions><Button onClick={() => setSourcesModalOpen(false)}>Done</Button></DialogActions>
      </Dialog>

      {/* Publish Modal */}
      <Dialog open={publishModalOpen} onClose={() => setPublishModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <PublishIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Chat Saved - Ready to Publish
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Your chat has been saved to your Drive. To publish it to the community:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><ArticleIcon color="primary" /></ListItemIcon>
              <ListItemText 
                primary="1. Edit in Drive (Optional)" 
                secondary="Open your saved chat in Google Drive to polish and refine the content before publishing."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><FolderIcon color="primary" /></ListItemIcon>
              <ListItemText 
                primary="2. Go to My Content" 
                secondary="Navigate to My Content to browse your saved chats and publish them to the community."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><PublishIcon color="primary" /></ListItemIcon>
              <ListItemText 
                primary="3. Publish to Proposed KB" 
                secondary="Submit your content for community review. Get upvotes to have it added to the main knowledge base!"
              />
            </ListItem>
          </List>
          {activeThread?.drive_file_id && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Your chat is saved and ready for publishing!
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishModalOpen(false)}>Close</Button>
          {setCurrentView && (
            <Button 
              variant="contained" 
              onClick={() => {
                setPublishModalOpen(false);
                // Navigate to My Content view
                if (typeof setCurrentView === 'function') {
                  setCurrentView('MY_CONTENT');
                }
              }}
            >
              Go to My Content
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
};

export default ChatWidget;

export const ChatControls = ({ googleDocId, handleGoogleDocIdChange }) => {
  return (
    <Box sx={{ padding: 2 }}>
      <TextField fullWidth label="Google Doc ID" variant="outlined" value={googleDocId} onChange={handleGoogleDocIdChange} />
    </Box>
  );
};
