export interface ReceiptData {
    amount: number;
    date: string;
    time?: string;
    narration: string;
    merchant?: string;
    refId?: string;
    sender?: string;
    receiver?: string;
    type?: 'debit' | 'credit';
}

export const parseReceiptText = (text: string): ReceiptData => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let amount = 0;
    let date = '';
    let time = '';
    let narration = '';
    let merchant = '';
    let refId = '';
    let sender = '';
    let receiver = '';
    let type: 'debit' | 'credit' | undefined;

    // Regex Patterns
    const amountRegex = /(?:₦|NGN|N)\s?([\d,]+(?:\.\d{2})?)/i;
    const dateRegex = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})|(\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{2,4})/i;
    const timeRegex = /(\d{1,2}:\d{2}(?::\d{2})?\s?(?:AM|PM)?)/i;
    const refRegex = /(?:Reference|Ref|Transaction ID|Session ID)[:\.]?\s*([A-Z0-9]+)/i;

    // Heuristic Parsing
    for (const line of lines) {
        const lowerLine = line.toLowerCase();

        // 1. Find Amount
        if (!amount && amountRegex.test(line)) {
            const match = line.match(amountRegex);
            if (match && match[1]) {
                const numericString = match[1].replace(/,/g, '');
                const val = parseFloat(numericString);
                if (!isNaN(val) && val > 0 && val < 100000000) {
                    amount = val;
                }
            }
        }

        // 2. Find Date
        if (!date && dateRegex.test(line)) {
            const match = line.match(dateRegex);
            if (match) date = match[0];
        }

        // 3. Find Time (Avoid date conflation)
        if (!time && timeRegex.test(line) && !line.match(/Date/i)) { // Simple guard
            const match = line.match(timeRegex);
            if (match) time = match[0];
        }

        // 4. Find Reference
        if (!refId && refRegex.test(line)) {
            const match = line.match(refRegex);
            if (match) refId = match[1];
        }

        // 5. Find Type
        if (!type) {
            if (lowerLine.includes('debit')) type = 'debit';
            else if (lowerLine.includes('credit')) type = 'credit';
        }

        // 6. Find Sender / Receiver
        if (lowerLine.startsWith('sender') || lowerLine.startsWith('from:')) {
            sender = line.replace(/^(sender( name)?|from)[:\.]?\s*/i, '').trim();
        }
        if (lowerLine.startsWith('receiver') || lowerLine.startsWith('beneficiary') || lowerLine.startsWith('to:')) {
            receiver = line.replace(/^(receiver( name)?|beneficiary|to)[:\.]?\s*/i, '').trim();
        }

        // 7. Find Merchant / Bank Keywords
        if (lowerLine.includes('uba') || lowerLine.includes('united bank')) merchant = 'UBA';
        if (lowerLine.includes('gtbank') || lowerLine.includes('guaranty')) merchant = 'GTBank';
        if (lowerLine.includes('zenith')) merchant = 'Zenith Bank';
        if (lowerLine.includes('access')) merchant = 'Access Bank';

        // 8. Guess Narration
        if (lowerLine.startsWith('narration') || lowerLine.startsWith('description') || lowerLine.startsWith('desc')) {
            narration = line.replace(/^(narration|description|desc)[:\.]?\s*/i, '').trim();
        }
        // Special case for Zenith "Trenitee" style description which is often just the line below specific headers? 
        // For now sticking to explicit labels.
    }

    // Fallback Narration if empty
    if (!narration) {
        if (receiver) narration = `Transfer to ${receiver}`;
        else if (sender) narration = `Transfer from ${sender}`;
        else if (merchant) narration = `Transfer from ${merchant}`;
        else narration = 'Uncategorized Expense';
    }

    return { amount, date, time, narration, merchant, refId, sender, receiver, type };
};
