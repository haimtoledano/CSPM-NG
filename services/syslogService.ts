import { AuditLog, SyslogConfig } from '../types';

/**
 * Common Event Format (CEF) Structure:
 * CEF:Version|Device Vendor|Device Product|Device Version|Device Event Class ID|Name|Severity|[Extension]
 */
export const formatCEF = (log: AuditLog): string => {
    const version = 0;
    const deviceVendor = "CSPM-NG";
    const deviceProduct = "UnifiedSecurityPlatform";
    const deviceVersion = "1.0.0";
    const deviceEventClassId = log.action; // e.g., CREATE_CONNECTOR
    const name = log.action.replace(/_/g, ' '); // e.g., CREATE CONNECTOR
    const severity = "3"; // Default medium severity for audit logs

    // Extension fields (Key=Value)
    // src=Source IP, suser=Source User, msg=Message/Target
    const extension = `src=${log.ip_address} suser=${log.actor} msg=Target: ${log.target} timestamp=${log.timestamp}`;

    return `CEF:${version}|${deviceVendor}|${deviceProduct}|${deviceVersion}|${deviceEventClassId}|${name}|${severity}|${extension}`;
};

/**
 * Simulates sending a Syslog message.
 * In a browser environment, we cannot open raw UDP/TCP sockets. 
 * This function prepares the payload that a backend proxy would send.
 */
export const sendTestSyslog = async (config: SyslogConfig, log: AuditLog): Promise<string> => {
    if (!config.enabled) {
        throw new Error("Syslog forwarding is disabled.");
    }

    const cefMessage = formatCEF(log);
    
    console.log(`[Syslog Simulator] Sending to ${config.protocol}://${config.host}:${config.port}`);
    console.log(`[Payload] ${cefMessage}`);

    // Simulating network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return cefMessage;
};