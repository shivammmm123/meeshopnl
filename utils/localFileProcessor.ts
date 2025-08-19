import { parseNumber, parseString, parseDate, runFullAnalysis } from './dataProcessor';
import { FilesData, SkuPrices, AllDashboardsData, FilterContextData, UploadableFile } from '../types';

// Since XLSX is loaded from a script tag in index.html, we declare it here to satisfy TypeScript.
declare var XLSX: any;

export interface LocalProcessorPayload {
    allDashboardData: AllDashboardsData,
    filterContext: FilterContextData,
    newFilesData: FilesData,
}

const fileConfigs = {
  payments: { 
    sheetName: "Order Payments", 
    range: 2, // Header on row 2, data starts on row 3
    parser: (row: any[]) => ({ 
        orderId: parseString(row[0]),       // Col A
        orderDate: parseDate(row[1]),       // Col B
        sku: parseString(row[4]),           // Col E
        status: parseString(row[5]),        // Col F
        gstRate: parseNumber(row[6]),       // Col G
        finalPayment: parseNumber(row[11]), // Col L
        invoicePrice: parseNumber(row[14]), // Col O
        returnCost: parseNumber(row[25]),   // Col Z
        tcs: parseNumber(row[32]),          // Col AG
        tds: parseNumber(row[34]),          // Col AI
        claimAmount: parseNumber(row[36]),  // Col AK
        recovery: parseNumber(row[37]),     // Col AL
    }) 
  },
  orders: { 
    sheetName: null, 
    range: 1, // Header is on row 1, data starts on row 2
    parser: (row: any[]) => ({ 
        status: parseString(row[0]),     // Column A
        orderId: parseString(row[1]),    // Column B is Sub Order No
        state: parseString(row[3]),      // Column D
        sku: parseString(row[5]),        // Column F
        size: parseString(row[6]),       // Column G
    }) 
  },
  // Corrected configuration for Returns based on user feedback
  returns: { 
    sheetName: null, 
    range: 8, // Header on row 8, data starts on row 9
    parser: (row: any[]) => ({ 
        sku: parseString(row[2]),         // Col C
        size: parseString(row[3]),        // Col D ('Variation')
        category: parseString(row[5]),    // Col F
        orderId: parseString(row[8]),     // Col I ('Suborder Number')
        returnType: parseString(row[11]), // Col L
        returnReason: parseString(row[19]),// Col T
        subReason: parseString(row[20]),  // Col U
    }) 
  }
};

const normalizeHeader = (text: string | undefined): string => {
    return String(text || '').replace(/\s+/g, '').toLowerCase();
}

export const processFileLocally = async (
  file: File,
  fileType: UploadableFile,
  existingFilesData: FilesData,
  skuPrices: SkuPrices | null,
  onProgress: (progress: { value: number, message: string }) => void
): Promise<LocalProcessorPayload> => {

    onProgress({ value: 10, message: 'Reading file...' });
    const data = await file.arrayBuffer();

    onProgress({ value: 30, message: 'Parsing workbook...' });
    if (typeof XLSX === 'undefined') {
        throw new Error('SheetJS library (XLSX) is not loaded.');
    }
    const workbook = XLSX.read(data, { type: 'array', cellDates: false, raw: true });

    const config = fileConfigs[fileType];
    let sheet: any;
    let dataStartRow: number = config.range; // Default start row

    if (fileType === 'orders' || fileType === 'returns') {
        const validations = {
            orders: (headers: string[]) => {
                const h = headers.map(normalizeHeader);
                // Stricter validation based on 'Sub Order No' (Col B) and SKU (Col F)
                return h[1]?.includes('suborderno') && h[5]?.includes('sku');
            },
            returns: (headers: string[]) => {
                const h = headers.map(normalizeHeader);
                // Check for 'SKU' (Col C) and 'Suborder Number' (Col I)
                return h[2]?.includes('sku') && h[8]?.includes('subordernumber');
            }
        };

        const validateRow = validations[fileType];
        
        sheetSearch:
        for (const sName of workbook.SheetNames) {
            const currentSheet = workbook.Sheets[sName];
            if (!currentSheet || !currentSheet['!ref']) continue;

            const MAX_HEADER_ROW_SCAN = 10;
            const sheetRange = XLSX.utils.decode_range(currentSheet['!ref']);

            for (let i = 0; i < MAX_HEADER_ROW_SCAN && i <= sheetRange.e.r; i++) {
                try {
                    const headers = (XLSX.utils.sheet_to_json(currentSheet, {
                        header: 1,
                        range: i,
                        defval: ""
                    })[0] || []) as string[];
                    
                    if (headers.length > 5 && validateRow(headers)) {
                        sheet = currentSheet;
                        dataStartRow = i + 1; // Data starts on the row after the header
                        break sheetSearch;
                    }
                } catch (e) {
                    console.warn(`Could not check headers for sheet: ${sName} at row ${i}`, e);
                }
            }
        }
    } else if (fileType === 'payments') {
        const foundSheetName = workbook.SheetNames.find((name: string) => name.trim() === config.sheetName);
        if (foundSheetName) {
            sheet = workbook.Sheets[foundSheetName];
        }
    }


    if (!sheet) {
        let errorHint = "Please ensure the file contains a sheet with the correct headers.";
        if (fileType === 'orders') {
            errorHint = "Please ensure the file contains a sheet with 'Sub Order No' in column B and 'SKU' in column F in the header row.";
        } else if (fileType === 'returns') {
            errorHint = "Please ensure the file contains a sheet with 'SKU' in column C and 'Suborder Number' in column I in the header row.";
        } else if (fileType === 'payments') {
             errorHint = `Please ensure the file contains a sheet named exactly '${config.sheetName}'.`;
        }
        throw new Error(`Could not find a valid sheet in ${file.name}. ${errorHint}`);
    }

    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, range: dataStartRow, defval: "" });
    const parsedData = jsonData.map(config.parser).filter((d: any) => d.orderId || d.sku);

    let adsCost = 0;
    if (fileType === 'payments') {
        const adsSheetName = workbook.SheetNames.find((name: string) => name.trim().toLowerCase() === "ads cost");
        if (adsSheetName) {
            const adsSheet = workbook.Sheets[adsSheetName];
            // Header on row 3, data on row 4, so range is 3
            adsCost = XLSX.utils.sheet_to_json(adsSheet, { header: 1, range: 3, defval: "" }).reduce((acc: number, row: any[]) => acc + (parseNumber(row[7]) || 0), 0);
        }
    }

    onProgress({ value: 60, message: 'Merging data...' });
    const updatedFilesData = { ...existingFilesData, [fileType]: parsedData };
    if (adsCost > 0 || updatedFilesData.adsCost) {
        updatedFilesData.adsCost = (existingFilesData.adsCost || 0) + adsCost;
    }
    
    onProgress({ value: 75, message: 'Calculating analytics...' });
    const { allDashboardData, filterContext } = runFullAnalysis(updatedFilesData, skuPrices);

    return { allDashboardData, filterContext, newFilesData: updatedFilesData };
};