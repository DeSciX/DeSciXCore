import React, { createContext, useState, useContext } from 'react';
import { NetworkLoadingType } from './AppData';

export const NetworkLoadingContext = createContext();
export const NetworkLoadingProvider = ({ children }) => {
    const [loadingStates, setLoadingStates] = useState({
        [NetworkLoadingType.FETCH_COMMUNITIES]: { loading: false, message: 'Retrieving community data.' },
        [NetworkLoadingType.FETCH_MY_PURCHASES]: { loading: false, message: 'Retrieving purchase history.' },
        [NetworkLoadingType.GET_AI_RESPONSE]: { loading: false, message: 'Waiting for AI response' },
        [NetworkLoadingType.PURCHASE_ROLE]: { loading: false, message: 'Executing purchases ...' },

    });

    const setNetworkLoading = (type, loading, message = '') => {
        setLoadingStates(prev => ({ ...prev, [type]: { loading, message } }));
    };

    return (
        <NetworkLoadingContext.Provider value={{ loadingStates, setNetworkLoading }}>
            {children}
        </NetworkLoadingContext.Provider>
    );
};

export const useNetworkLoading = (type) => {
    const { loadingStates, setNetworkLoading } = useContext(NetworkLoadingContext);
    return [loadingStates[type] || { loading: false, message: '' }, setNetworkLoading];
};