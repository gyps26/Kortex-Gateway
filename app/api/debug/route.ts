import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db/mongoose';
import { GlobalSettings } from '../../../models/GlobalSettings';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const conn = await connectToDatabase();
    
    const isReal = (val: string | undefined) => val && !val.startsWith('your_');
    
    // Check mongoose connection state
    const mongoState = mongoose.connection.readyState;
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const stateLabels: Record<number, string> = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    
    let settings = null;
    let settingsError = null;
    let totalDocs = 0;
    
    try {
      settings = await GlobalSettings.findOne({});
      totalDocs = await GlobalSettings.countDocuments({});
    } catch (e: any) {
      settingsError = e.message;
    }

    // Try a direct write test
    let writeTest = 'not attempted';
    if (mongoState === 1 && !settings) {
      try {
        const testDoc = await GlobalSettings.create({ ghlClientId: 'test_ping', ghlClientSecret: 'test_ping' });
        await GlobalSettings.deleteOne({ _id: testDoc._id });
        writeTest = 'SUCCESS - writes work';
      } catch (e: any) {
        writeTest = 'FAILED: ' + e.message;
      }
    }
    
    return NextResponse.json({
      dbConnected: !!conn,
      mongoState: stateLabels[mongoState] || `unknown(${mongoState})`,
      mongoDbName: mongoose.connection.db?.databaseName || '(unknown)',
      settingsExist: !!settings,
      settingsError,
      totalSettingsDocs: totalDocs,
      writeTest,
      dbClientId: settings?.ghlClientId ? settings.ghlClientId.substring(0, 8) + '...' : '(empty)',
      dbClientSecretLength: settings?.ghlClientSecret?.length || 0,
      dbClientSecretIsReal: isReal(settings?.ghlClientSecret),
      envClientId: isReal(process.env.GHL_CLIENT_ID) ? 'SET' : process.env.GHL_CLIENT_ID || '(missing)',
      envClientSecret: isReal(process.env.GHL_CLIENT_SECRET) ? 'SET' : process.env.GHL_CLIENT_SECRET || '(missing)',
      envRedirectUri: process.env.GHL_REDIRECT_URI || '(missing)',
      envAppUrl: process.env.APP_URL || '(missing)',
      envMongoUri: process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/\/.*@/, '//***@') : '(missing)',
    });
  } catch (error: any) {
    return NextResponse.json({ dbConnected: false, error: error.message }, { status: 500 });
  }
}
