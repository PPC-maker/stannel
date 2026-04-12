'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  Palette,
  Briefcase,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  Wrench,
  Users,
} from 'lucide-react';
import { useServiceProviders, useServiceProviderCategories } from '@/lib/api-hooks';
import { useAuth } from '@/lib/auth-context';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';

// Nirlat color families
const COLOR_FAMILIES = [
  { name: 'אדומים', key: 'red', colors: [
    { name: 'IS 0062', hex: '#C0392B' },
    { name: 'IS 0063', hex: '#E74C3C' },
    { name: 'IS 0064', hex: '#D35400' },
    { name: 'IS 0065', hex: '#CB4335' },
    { name: 'IS 0066', hex: '#B03A2E' },
  ]},
  { name: 'כתומים', key: 'orange', colors: [
    { name: 'IS 0030', hex: '#E67E22' },
    { name: 'IS 0031', hex: '#D35400' },
    { name: 'IS 0032', hex: '#F39C12' },
    { name: 'IS 0033', hex: '#E59866' },
  ]},
  { name: 'צהובים', key: 'yellow', colors: [
    { name: 'IS 0020', hex: '#F4D03F' },
    { name: 'IS 0021', hex: '#F7DC6F' },
    { name: 'IS 0022', hex: '#D4AC0D' },
    { name: 'IS 0023', hex: '#E8C03B' },
  ]},
  { name: 'ירוקים', key: 'green', colors: [
    { name: 'IS 0080', hex: '#27AE60' },
    { name: 'IS 0081', hex: '#2ECC71' },
    { name: 'IS 0082', hex: '#1E8449' },
    { name: 'IS 0083', hex: '#A9DFBF' },
  ]},
  { name: 'כחולים', key: 'blue', colors: [
    { name: 'IS 0070', hex: '#2E86C1' },
    { name: 'IS 0071', hex: '#3498DB' },
    { name: 'IS 0072', hex: '#1A5276' },
    { name: 'IS 0073', hex: '#85C1E9' },
  ]},
  { name: 'סגולים', key: 'purple', colors: [
    { name: 'IS 0090', hex: '#8E44AD' },
    { name: 'IS 0091', hex: '#9B59B6' },
    { name: 'IS 0092', hex: '#6C3483' },
    { name: 'IS 0093', hex: '#BB8FCE' },
  ]},
  { name: 'אפורים', key: 'gray', colors: [
    { name: 'IS 0010', hex: '#7F8C8D' },
    { name: 'IS 0011', hex: '#95A5A6' },
    { name: 'IS 0012', hex: '#5D6D7E' },
    { name: 'IS 0013', hex: '#ABB2B9' },
  ]},
  { name: 'לבנים', key: 'white', colors: [
    { name: 'IS 0001', hex: '#FDFEFE' },
    { name: 'IS 0002', hex: '#F8F9F9' },
    { name: 'IS 0003', hex: '#F2F3F4' },
    { name: 'IS 0004', hex: '#EAEDED' },
  ]},
];

// RAL color system - industrial standard colors
const RAL_COLORS = [
  // RAL 1000 series - Yellow and Beige
  { code: 'RAL 1000', name: 'בז\' ירוק', hex: '#BEBD7F' },
  { code: 'RAL 1001', name: 'בז\'', hex: '#C2B078' },
  { code: 'RAL 1002', name: 'צהוב חול', hex: '#C6A664' },
  { code: 'RAL 1003', name: 'צהוב אות', hex: '#E5BE01' },
  { code: 'RAL 1004', name: 'צהוב זהב', hex: '#CDA434' },
  { code: 'RAL 1005', name: 'צהוב דבש', hex: '#A98307' },
  { code: 'RAL 1006', name: 'צהוב תירס', hex: '#E4A010' },
  { code: 'RAL 1007', name: 'צהוב כרום', hex: '#DC9D00' },
  { code: 'RAL 1011', name: 'בז\' חום', hex: '#8A6642' },
  { code: 'RAL 1012', name: 'צהוב לימון', hex: '#C7B446' },
  { code: 'RAL 1013', name: 'לבן פנינה', hex: '#EAE6CA' },
  { code: 'RAL 1014', name: 'שנהב', hex: '#E1CC4F' },
  { code: 'RAL 1015', name: 'שנהב בהיר', hex: '#E6D690' },
  { code: 'RAL 1016', name: 'צהוב גופרית', hex: '#EDFF21' },
  { code: 'RAL 1017', name: 'צהוב זעפרן', hex: '#F5D033' },
  { code: 'RAL 1018', name: 'צהוב אבץ', hex: '#F8F32B' },
  { code: 'RAL 1019', name: 'בז\' אפור', hex: '#9E9764' },
  { code: 'RAL 1020', name: 'צהוב זית', hex: '#999950' },
  { code: 'RAL 1021', name: 'צהוב קדמיום', hex: '#F3DA0B' },
  { code: 'RAL 1023', name: 'צהוב תנועה', hex: '#FAD201' },
  { code: 'RAL 1024', name: 'צהוב אוכרה', hex: '#AEA04B' },
  { code: 'RAL 1026', name: 'צהוב זוהר', hex: '#FFFF00' },
  { code: 'RAL 1027', name: 'צהוב קארי', hex: '#9D9101' },
  { code: 'RAL 1028', name: 'צהוב מלון', hex: '#F4A900' },
  { code: 'RAL 1032', name: 'צהוב גפרור', hex: '#D6AE01' },
  { code: 'RAL 1033', name: 'צהוב דליה', hex: '#F3A505' },
  { code: 'RAL 1034', name: 'צהוב פסטל', hex: '#EFA94A' },
  { code: 'RAL 1035', name: 'בז\' פנינה', hex: '#6A5D4D' },
  { code: 'RAL 1036', name: 'זהב פנינה', hex: '#705335' },
  { code: 'RAL 1037', name: 'צהוב שמש', hex: '#F09200' },
  // RAL 2000 series - Orange
  { code: 'RAL 2000', name: 'כתום צהוב', hex: '#ED760E' },
  { code: 'RAL 2001', name: 'כתום אדום', hex: '#C93C20' },
  { code: 'RAL 2002', name: 'כתום דם', hex: '#CB2821' },
  { code: 'RAL 2003', name: 'כתום פסטל', hex: '#FF7514' },
  { code: 'RAL 2004', name: 'כתום טהור', hex: '#F44611' },
  { code: 'RAL 2005', name: 'כתום זוהר', hex: '#FF2301' },
  { code: 'RAL 2007', name: 'כתום בהיר זוהר', hex: '#FFA420' },
  { code: 'RAL 2008', name: 'כתום בהיר אדום', hex: '#F75E25' },
  { code: 'RAL 2009', name: 'כתום תנועה', hex: '#F54021' },
  { code: 'RAL 2010', name: 'כתום אות', hex: '#D84B20' },
  { code: 'RAL 2011', name: 'כתום עמוק', hex: '#EC7C26' },
  { code: 'RAL 2012', name: 'כתום סלמון', hex: '#E55137' },
  { code: 'RAL 2013', name: 'כתום פנינה', hex: '#C35831' },
  // RAL 3000 series - Red
  { code: 'RAL 3000', name: 'אדום אש', hex: '#AF2B1E' },
  { code: 'RAL 3001', name: 'אדום אות', hex: '#A52019' },
  { code: 'RAL 3002', name: 'אדום כרמין', hex: '#A2231D' },
  { code: 'RAL 3003', name: 'אדום רובי', hex: '#9B111E' },
  { code: 'RAL 3004', name: 'אדום סגול', hex: '#75151E' },
  { code: 'RAL 3005', name: 'אדום יין', hex: '#5E2129' },
  { code: 'RAL 3007', name: 'אדום שחור', hex: '#412227' },
  { code: 'RAL 3009', name: 'אדום חלודה', hex: '#642424' },
  { code: 'RAL 3011', name: 'אדום חום', hex: '#781F19' },
  { code: 'RAL 3012', name: 'אדום בז\'', hex: '#C1876B' },
  { code: 'RAL 3013', name: 'אדום עגבניה', hex: '#A12312' },
  { code: 'RAL 3014', name: 'אדום עתיק ורוד', hex: '#D36E70' },
  { code: 'RAL 3015', name: 'ורוד בהיר', hex: '#EA899A' },
  { code: 'RAL 3016', name: 'אדום אלמוג', hex: '#B32821' },
  { code: 'RAL 3017', name: 'ורוד', hex: '#E63244' },
  { code: 'RAL 3018', name: 'אדום תות', hex: '#D53032' },
  { code: 'RAL 3020', name: 'אדום תנועה', hex: '#CC0605' },
  { code: 'RAL 3022', name: 'אדום סלמון', hex: '#D95030' },
  { code: 'RAL 3024', name: 'אדום זוהר', hex: '#F80000' },
  { code: 'RAL 3026', name: 'אדום בהיר זוהר', hex: '#FE0000' },
  { code: 'RAL 3027', name: 'אדום פטל', hex: '#C51D34' },
  { code: 'RAL 3028', name: 'אדום טהור', hex: '#CB3234' },
  { code: 'RAL 3031', name: 'אדום אוריינט', hex: '#B32428' },
  { code: 'RAL 3032', name: 'אדום פנינה רובי', hex: '#721422' },
  { code: 'RAL 3033', name: 'אדום פנינה ורוד', hex: '#B44C43' },
  // RAL 4000 series - Violet
  { code: 'RAL 4001', name: 'לילך אדום', hex: '#6D3F5B' },
  { code: 'RAL 4002', name: 'סגול אדום', hex: '#922B3E' },
  { code: 'RAL 4003', name: 'ורוד היידר', hex: '#DE4C8A' },
  { code: 'RAL 4004', name: 'בורדו', hex: '#641C34' },
  { code: 'RAL 4005', name: 'לילך כחול', hex: '#6C4675' },
  { code: 'RAL 4006', name: 'סגול תנועה', hex: '#A03472' },
  { code: 'RAL 4007', name: 'סגול סגול', hex: '#4A192C' },
  { code: 'RAL 4008', name: 'סגול אות', hex: '#924E7D' },
  { code: 'RAL 4009', name: 'סגול פסטל', hex: '#A18594' },
  { code: 'RAL 4010', name: 'טלקום', hex: '#CF3476' },
  { code: 'RAL 4011', name: 'סגול פנינה', hex: '#8673A1' },
  { code: 'RAL 4012', name: 'סגול פנינה שחור', hex: '#6C6874' },
  // RAL 5000 series - Blue
  { code: 'RAL 5000', name: 'כחול סגול', hex: '#354D73' },
  { code: 'RAL 5001', name: 'כחול ירוק', hex: '#1F3438' },
  { code: 'RAL 5002', name: 'כחול אולטרה', hex: '#20214F' },
  { code: 'RAL 5003', name: 'כחול ספיר', hex: '#1D1E33' },
  { code: 'RAL 5004', name: 'כחול שחור', hex: '#18171C' },
  { code: 'RAL 5005', name: 'כחול אות', hex: '#1E2460' },
  { code: 'RAL 5007', name: 'כחול בריליאנט', hex: '#3E5F8A' },
  { code: 'RAL 5008', name: 'כחול אפור', hex: '#26252D' },
  { code: 'RAL 5009', name: 'כחול אזור', hex: '#025669' },
  { code: 'RAL 5010', name: 'כחול אנצי', hex: '#0E294B' },
  { code: 'RAL 5011', name: 'כחול פלדה', hex: '#231A24' },
  { code: 'RAL 5012', name: 'כחול בהיר', hex: '#3B83BD' },
  { code: 'RAL 5013', name: 'כחול קובלט', hex: '#1E213D' },
  { code: 'RAL 5014', name: 'כחול יונה', hex: '#606E8C' },
  { code: 'RAL 5015', name: 'כחול שמים', hex: '#2271B3' },
  { code: 'RAL 5017', name: 'כחול תנועה', hex: '#063971' },
  { code: 'RAL 5018', name: 'כחול טורקיז', hex: '#3F888F' },
  { code: 'RAL 5019', name: 'כחול קפרי', hex: '#1B5583' },
  { code: 'RAL 5020', name: 'כחול אוקיינוס', hex: '#1D334A' },
  { code: 'RAL 5021', name: 'כחול מים', hex: '#256D7B' },
  { code: 'RAL 5022', name: 'כחול לילה', hex: '#252850' },
  { code: 'RAL 5023', name: 'כחול מרחוק', hex: '#49678D' },
  { code: 'RAL 5024', name: 'כחול פסטל', hex: '#5D9B9B' },
  { code: 'RAL 5025', name: 'כחול פנינה אנצי', hex: '#2A6478' },
  { code: 'RAL 5026', name: 'כחול פנינה לילה', hex: '#102C54' },
  // RAL 6000 series - Green
  { code: 'RAL 6000', name: 'ירוק פטינה', hex: '#316650' },
  { code: 'RAL 6001', name: 'ירוק אמרלד', hex: '#287233' },
  { code: 'RAL 6002', name: 'ירוק עלה', hex: '#2D572C' },
  { code: 'RAL 6003', name: 'ירוק זית', hex: '#424632' },
  { code: 'RAL 6004', name: 'ירוק כחול', hex: '#1F3A3D' },
  { code: 'RAL 6005', name: 'ירוק אשוח', hex: '#2F4538' },
  { code: 'RAL 6006', name: 'ירוק זית אפור', hex: '#3E3B32' },
  { code: 'RAL 6007', name: 'ירוק בקבוק', hex: '#343B29' },
  { code: 'RAL 6008', name: 'ירוק חום', hex: '#39352A' },
  { code: 'RAL 6009', name: 'ירוק אשוח', hex: '#31372B' },
  { code: 'RAL 6010', name: 'ירוק דשא', hex: '#35682D' },
  { code: 'RAL 6011', name: 'ירוק רזדה', hex: '#587246' },
  { code: 'RAL 6012', name: 'ירוק שחור', hex: '#343E40' },
  { code: 'RAL 6013', name: 'ירוק קנה', hex: '#6C7156' },
  { code: 'RAL 6014', name: 'ירוק זית צהוב', hex: '#47402E' },
  { code: 'RAL 6015', name: 'ירוק זית שחור', hex: '#3B3C36' },
  { code: 'RAL 6016', name: 'ירוק טורקיז', hex: '#1E5945' },
  { code: 'RAL 6017', name: 'ירוק מאי', hex: '#4C9141' },
  { code: 'RAL 6018', name: 'ירוק צהוב', hex: '#57A639' },
  { code: 'RAL 6019', name: 'ירוק פסטל', hex: '#BDECB6' },
  { code: 'RAL 6020', name: 'ירוק כרום', hex: '#2E3A23' },
  { code: 'RAL 6021', name: 'ירוק חיוור', hex: '#89AC76' },
  { code: 'RAL 6022', name: 'ירוק זית חום', hex: '#25221B' },
  { code: 'RAL 6024', name: 'ירוק תנועה', hex: '#308446' },
  { code: 'RAL 6025', name: 'ירוק שרך', hex: '#3D642D' },
  { code: 'RAL 6026', name: 'ירוק אופל', hex: '#015D52' },
  { code: 'RAL 6027', name: 'ירוק בהיר', hex: '#84C3BE' },
  { code: 'RAL 6028', name: 'ירוק אורן', hex: '#2C5545' },
  { code: 'RAL 6029', name: 'ירוק מנטה', hex: '#20603D' },
  { code: 'RAL 6032', name: 'ירוק אות', hex: '#317F43' },
  { code: 'RAL 6033', name: 'ירוק מנטה טורקיז', hex: '#497E76' },
  { code: 'RAL 6034', name: 'ירוק טורקיז פסטל', hex: '#7FB5B5' },
  { code: 'RAL 6035', name: 'ירוק פנינה', hex: '#1C542D' },
  { code: 'RAL 6036', name: 'ירוק פנינה אופל', hex: '#193737' },
  { code: 'RAL 6037', name: 'ירוק טהור', hex: '#008F39' },
  { code: 'RAL 6038', name: 'ירוק זוהר', hex: '#00BB2D' },
  // RAL 7000 series - Grey
  { code: 'RAL 7000', name: 'אפור סנאי', hex: '#78858B' },
  { code: 'RAL 7001', name: 'אפור כסף', hex: '#8A9597' },
  { code: 'RAL 7002', name: 'אפור זית', hex: '#7E7B52' },
  { code: 'RAL 7003', name: 'אפור טחב', hex: '#6C7059' },
  { code: 'RAL 7004', name: 'אפור אות', hex: '#969992' },
  { code: 'RAL 7005', name: 'אפור עכבר', hex: '#646B63' },
  { code: 'RAL 7006', name: 'אפור בז\'', hex: '#6D6552' },
  { code: 'RAL 7008', name: 'אפור חאקי', hex: '#6A5F31' },
  { code: 'RAL 7009', name: 'אפור ירוק', hex: '#4D5645' },
  { code: 'RAL 7010', name: 'אפור אוהל', hex: '#4C514A' },
  { code: 'RAL 7011', name: 'אפור ברזל', hex: '#434B4D' },
  { code: 'RAL 7012', name: 'אפור בזלת', hex: '#4E5754' },
  { code: 'RAL 7013', name: 'אפור חום', hex: '#464531' },
  { code: 'RAL 7015', name: 'אפור צפחה', hex: '#434750' },
  { code: 'RAL 7016', name: 'אפור אנתרציט', hex: '#293133' },
  { code: 'RAL 7021', name: 'אפור שחור', hex: '#23282B' },
  { code: 'RAL 7022', name: 'אפור אומברה', hex: '#332F2C' },
  { code: 'RAL 7023', name: 'אפור בטון', hex: '#686C5E' },
  { code: 'RAL 7024', name: 'אפור גרפיט', hex: '#474A51' },
  { code: 'RAL 7026', name: 'אפור גרניט', hex: '#2F353B' },
  { code: 'RAL 7030', name: 'אפור אבן', hex: '#8B8C7A' },
  { code: 'RAL 7031', name: 'אפור כחול', hex: '#474B4E' },
  { code: 'RAL 7032', name: 'אפור חצץ', hex: '#B8B799' },
  { code: 'RAL 7033', name: 'אפור צמנט', hex: '#7D8471' },
  { code: 'RAL 7034', name: 'אפור צהוב', hex: '#8F8B66' },
  { code: 'RAL 7035', name: 'אפור בהיר', hex: '#D7D7D7' },
  { code: 'RAL 7036', name: 'אפור פלטינה', hex: '#7F7679' },
  { code: 'RAL 7037', name: 'אפור אבק', hex: '#7D7F7D' },
  { code: 'RAL 7038', name: 'אפור אגת', hex: '#B5B8B1' },
  { code: 'RAL 7039', name: 'אפור קוורץ', hex: '#6C6960' },
  { code: 'RAL 7040', name: 'אפור חלון', hex: '#9DA1AA' },
  { code: 'RAL 7042', name: 'אפור תנועה A', hex: '#8D948D' },
  { code: 'RAL 7043', name: 'אפור תנועה B', hex: '#4E5452' },
  { code: 'RAL 7044', name: 'אפור משי', hex: '#CAC4B0' },
  { code: 'RAL 7045', name: 'אפור טלקום 1', hex: '#909090' },
  { code: 'RAL 7046', name: 'אפור טלקום 2', hex: '#82898F' },
  { code: 'RAL 7047', name: 'אפור טלקום 4', hex: '#D0D0D0' },
  { code: 'RAL 7048', name: 'אפור פנינה עכבר', hex: '#898176' },
  // RAL 8000 series - Brown
  { code: 'RAL 8000', name: 'חום ירוק', hex: '#826C34' },
  { code: 'RAL 8001', name: 'חום אוכרה', hex: '#955F20' },
  { code: 'RAL 8002', name: 'חום אות', hex: '#6C3B2A' },
  { code: 'RAL 8003', name: 'חום חמר', hex: '#734222' },
  { code: 'RAL 8004', name: 'חום נחושת', hex: '#8E402A' },
  { code: 'RAL 8007', name: 'חום צבי', hex: '#59351F' },
  { code: 'RAL 8008', name: 'חום זית', hex: '#6F4F28' },
  { code: 'RAL 8011', name: 'חום אגוז', hex: '#5B3A29' },
  { code: 'RAL 8012', name: 'חום אדום', hex: '#592321' },
  { code: 'RAL 8014', name: 'חום ספיה', hex: '#382C1E' },
  { code: 'RAL 8015', name: 'חום ערמונים', hex: '#633A34' },
  { code: 'RAL 8016', name: 'חום מהגוני', hex: '#4C2F27' },
  { code: 'RAL 8017', name: 'חום שוקולד', hex: '#45322E' },
  { code: 'RAL 8019', name: 'חום אפור', hex: '#403A3A' },
  { code: 'RAL 8022', name: 'חום שחור', hex: '#212121' },
  { code: 'RAL 8023', name: 'חום כתום', hex: '#A65E2E' },
  { code: 'RAL 8024', name: 'חום בז\'', hex: '#79553D' },
  { code: 'RAL 8025', name: 'חום חיוור', hex: '#755C48' },
  { code: 'RAL 8028', name: 'חום אדמה', hex: '#4E3B31' },
  { code: 'RAL 8029', name: 'חום פנינה נחושת', hex: '#763C28' },
  // RAL 9000 series - White and Black
  { code: 'RAL 9001', name: 'לבן קרם', hex: '#FDF4E3' },
  { code: 'RAL 9002', name: 'לבן אפור', hex: '#E7EBDA' },
  { code: 'RAL 9003', name: 'לבן אות', hex: '#F4F4F4' },
  { code: 'RAL 9004', name: 'שחור אות', hex: '#282828' },
  { code: 'RAL 9005', name: 'שחור עורב', hex: '#0A0A0A' },
  { code: 'RAL 9006', name: 'אלומיניום לבן', hex: '#A5A5A5' },
  { code: 'RAL 9007', name: 'אלומיניום אפור', hex: '#8F8F8F' },
  { code: 'RAL 9010', name: 'לבן טהור', hex: '#FFFFFF' },
  { code: 'RAL 9011', name: 'שחור גרפיט', hex: '#1C1C1C' },
  { code: 'RAL 9016', name: 'לבן תנועה', hex: '#F6F6F6' },
  { code: 'RAL 9017', name: 'שחור תנועה', hex: '#1E1E1E' },
  { code: 'RAL 9018', name: 'לבן פפירוס', hex: '#D7D7D7' },
];

// Wood stain colors
const WOOD_COLORS = [
  // Metal colors
  { code: '8912-711', name: 'אבץ מט', hex: '#808080', category: 'מתכת' },
  { code: '731', name: 'חום אגוז', hex: '#5C4033', category: 'מתכת' },
  { code: '729', name: 'אגוז מט', hex: '#6B4423', category: 'מתכת' },
  { code: '732', name: 'אלון כהה', hex: '#8B4513', category: 'מתכת' },
  { code: '730', name: 'אוכרה', hex: '#CC7722', category: 'מתכת' },
  { code: '869', name: 'מנטולי', hex: '#808000', category: 'מתכת' },
  { code: '888', name: 'שקד כהה', hex: '#A0522D', category: 'מתכת' },
  { code: '733', name: 'אורן בהיר', hex: '#DEB887', category: 'מתכת' },
  { code: '738', name: 'אדום', hex: '#8B0000', category: 'מתכת' },
  { code: '884', name: 'שקמה כהה', hex: '#654321', category: 'מתכת' },
  { code: '724', name: 'אלקטרודה', hex: '#2F4F4F', category: 'מתכת' },
  { code: '735', name: 'אורן קליל', hex: '#F5DEB3', category: 'מתכת' },
  // Semi-transparent wood stains
  { code: 'A590', name: 'לבן חם', hex: '#FDF5E6', category: 'צבע עץ חצי שקוף' },
  { code: 'A 841', name: 'שחור', hex: '#1C1C1C', category: 'צבע עץ חצי שקוף' },
  { code: 'A 532', name: 'אגס', hex: '#D2691E', category: 'צבע עץ חצי שקוף' },
  { code: 'A530', name: 'פליסנדר', hex: '#8B4513', category: 'צבע עץ חצי שקוף' },
  { code: 'A631', name: 'דובדבן', hex: '#B22222', category: 'צבע עץ חצי שקוף' },
  { code: 'A585', name: 'אגוז בהיר', hex: '#DEB887', category: 'צבע עץ חצי שקוף' },
  { code: 'A563', name: 'ירוק עד', hex: '#228B22', category: 'צבע עץ חצי שקוף' },
  { code: 'A613', name: 'כחול כעשן', hex: '#4682B4', category: 'צבע עץ חצי שקוף' },
  { code: 'A606', name: 'כחול כלים', hex: '#4169E1', category: 'צבע עץ חצי שקוף' },
  { code: 'A562', name: 'כחול ים', hex: '#0000CD', category: 'צבע עץ חצי שקוף' },
  { code: 'A614', name: 'ביקטור', hex: '#2E8B57', category: 'צבע עץ חצי שקוף' },
  { code: 'A501', name: 'אפור סלתי', hex: '#708090', category: 'צבע עץ חצי שקוף' },
  { code: 'A503', name: 'חרדל עמוק', hex: '#8B8000', category: 'צבע עץ חצי שקוף' },
  { code: 'A507', name: 'אדום חם', hex: '#CD5C5C', category: 'צבע עץ חצי שקוף' },
  { code: 'A615', name: 'מהתה', hex: '#D2B48C', category: 'צבע עץ חצי שקוף' },
  { code: 'A611', name: 'אבוקדו', hex: '#568203', category: 'צבע עץ חצי שקוף' },
  { code: 'A512', name: 'ירוק צהוב', hex: '#9ACD32', category: 'צבע עץ חצי שקוף' },
  { code: 'A511', name: 'ירוק שקד', hex: '#808000', category: 'צבע עץ חצי שקוף' },
  // Natural wood tones
  { code: '781-543', name: 'אגוז', hex: '#5D4037', category: 'עץ טבעי' },
  { code: '781-533', name: 'ערמון', hex: '#8B4513', category: 'עץ טבעי' },
  { code: '702610', name: 'אורן', hex: '#DEB887', category: 'עץ טבעי' },
  { code: '781-534', name: 'אגוז', hex: '#6F4E37', category: 'עץ טבעי' },
  { code: '781-536', name: 'טיק כהה', hex: '#A0522D', category: 'עץ טבעי' },
  { code: '781-548', name: 'אורן', hex: '#D2B48C', category: 'עץ טבעי' },
];

const CATEGORY_LABELS: Record<string, string> = {
  CONTRACTOR: 'קבלן',
  ELECTRICIAN: 'חשמלאי',
  PLUMBER: 'אינסטלטור',
  PAINTER: 'צבעי',
  CARPENTER: 'נגר',
  LANDSCAPER: 'גנן',
  INTERIOR_DESIGNER: 'מעצב פנים',
  OTHER: 'אחר',
};

type ColorSystemType = 'nirlat' | 'ral' | 'wood';

export default function ToolsPage() {
  const { isReady } = useAuthGuard();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'colors' | 'providers'>('colors');
  const [colorSystem, setColorSystem] = useState<ColorSystemType>('nirlat');
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string; code?: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const { data: providersData, isLoading: providersLoading } = useServiceProviders(selectedCategory);
  const { data: categoriesData } = useServiceProviderCategories();

  const providers = providersData?.data || [];
  const categories = categoriesData?.categories || [];

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  if (user?.role !== 'ARCHITECT' && user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#0f2620] -mt-16 flex items-center justify-center">
        <div className="text-center">
          <Wrench size={64} className="mx-auto text-white/30 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">גישה מוגבלת</h1>
          <p className="text-white/60">עמוד זה זמין לאדריכלים בלבד</p>
        </div>
      </div>
    );
  }

  const TABS = [
    { key: 'colors' as const, label: 'מניפת צבעים', icon: Palette },
    { key: 'providers' as const, label: 'נותני שירות', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Hero Background */}
      <div className="absolute inset-x-0 top-0 h-[35vh]">
        <Image
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80"
          alt="Tools"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2620]/30 via-transparent to-[#0f2620]" />
      </div>

      <div className="relative z-10 p-6 pt-28 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Wrench className="text-emerald-400" />
            כלים לאדריכלים
          </h1>
          <p className="text-white/60 mt-1">מניפות צבעים ונותני שירות</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex gap-2">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Color Catalog */}
        {activeTab === 'colors' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              {/* Color System Title */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Palette size={20} className="text-emerald-400" />
                  מניפת צבעים
                </h2>
                <a
                  href="https://nirlat.com/fan/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white/60 hover:text-emerald-400 transition-colors"
                >
                  <ExternalLink size={16} />
                  מניפה מלאה באתר נירלאט
                </a>
              </div>

              {/* Color System Tabs */}
              <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-white/10">
                <button
                  onClick={() => { setColorSystem('nirlat'); setSelectedColor(null); }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    colorSystem === 'nirlat'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'
                  }`}
                >
                  צבעי נירלאט
                </button>
                <button
                  onClick={() => { setColorSystem('ral'); setSelectedColor(null); }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    colorSystem === 'ral'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'
                  }`}
                >
                  צבעי מתכת לפי טבלת RAL
                </button>
                <button
                  onClick={() => { setColorSystem('wood'); setSelectedColor(null); }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    colorSystem === 'wood'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'
                  }`}
                >
                  צבע עץ חצי שקוף
                </button>
              </div>

              {/* Subtitle for RAL */}
              {colorSystem === 'ral' && (
                <p className="text-white/60 text-sm mb-4">
                  לבחירת צבעי מתכת השתמשו בטבלת RAL, לצבעי עץ גלגלו למטה
                </p>
              )}

              {/* Subtitle for Wood */}
              {colorSystem === 'wood' && (
                <p className="text-white/60 text-sm mb-4">
                  צבעים אפשריים:
                </p>
              )}

              {/* Selected Color Display */}
              {selectedColor && (
                <div className="mb-6 p-4 bg-white/10 rounded-xl flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-lg border-2 border-white/20"
                    style={{ backgroundColor: selectedColor.hex }}
                  />
                  <div>
                    {selectedColor.code && (
                      <p className="text-emerald-400 text-sm font-mono">{selectedColor.code}</p>
                    )}
                    <p className="text-white font-medium">{selectedColor.name}</p>
                    <p className="text-white/60 text-sm">HEX: {selectedColor.hex}</p>
                  </div>
                  <button
                    onClick={() => setSelectedColor(null)}
                    className="mr-auto text-white/50 hover:text-white text-sm"
                  >
                    סגור
                  </button>
                </div>
              )}

              {/* Nirlat Colors */}
              {colorSystem === 'nirlat' && (
                <div className="space-y-6">
                  {COLOR_FAMILIES.map((family, familyIndex) => (
                    <motion.div
                      key={family.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: familyIndex * 0.05 }}
                      className="bg-white/5 rounded-xl p-4"
                    >
                      <p className="text-white/60 text-sm uppercase tracking-wider mb-3 font-medium">
                        {family.name}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {family.colors.map(color => (
                          <button
                            key={color.name}
                            onClick={() => setSelectedColor(color)}
                            className={`group relative transition-transform hover:scale-110 ${
                              selectedColor?.hex === color.hex ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#0f2620]' : ''
                            }`}
                            title={`${color.name} — ${color.hex}`}
                          >
                            <div
                              className="w-12 h-12 rounded-lg border border-white/20"
                              style={{ backgroundColor: color.hex }}
                            />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* RAL Colors Grid */}
              {colorSystem === 'ral' && (
                <div className="bg-white rounded-xl p-4 overflow-x-auto">
                  <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1 min-w-[600px]">
                    {RAL_COLORS.map((color, index) => (
                      <button
                        key={color.code}
                        onClick={() => setSelectedColor({ name: color.name, hex: color.hex, code: color.code })}
                        className={`group relative transition-all hover:scale-105 hover:z-10 ${
                          selectedColor?.code === color.code ? 'ring-2 ring-emerald-500 ring-offset-1' : ''
                        }`}
                        title={`${color.code} — ${color.name}`}
                      >
                        <div
                          className="w-full aspect-square border border-gray-200"
                          style={{ backgroundColor: color.hex }}
                        />
                        <p className="text-[8px] text-gray-600 text-center mt-0.5 truncate font-mono">
                          {color.code}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Wood Colors */}
              {colorSystem === 'wood' && (
                <div className="space-y-6">
                  {/* Group by category */}
                  {['מתכת', 'צבע עץ חצי שקוף', 'עץ טבעי'].map((category) => {
                    const categoryColors = WOOD_COLORS.filter(c => c.category === category);
                    if (categoryColors.length === 0) return null;

                    return (
                      <div key={category} className="bg-white/5 rounded-xl p-4">
                        <p className="text-white/60 text-sm uppercase tracking-wider mb-4 font-medium">
                          {category}
                        </p>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                          {categoryColors.map((color) => (
                            <button
                              key={color.code}
                              onClick={() => setSelectedColor({ name: color.name, hex: color.hex, code: color.code })}
                              className={`group relative transition-all hover:scale-105 ${
                                selectedColor?.code === color.code ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#0f2620]' : ''
                              }`}
                              title={`${color.code} — ${color.name}`}
                            >
                              <div
                                className="w-full aspect-square rounded-lg border border-white/20"
                                style={{ backgroundColor: color.hex }}
                              />
                              <p className="text-[10px] text-white/60 text-center mt-1 truncate">
                                {color.name}
                              </p>
                              <p className="text-[8px] text-white/40 text-center font-mono">
                                {color.code}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Service Providers */}
        {activeTab === 'providers' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Users size={20} className="text-emerald-400" />
                  נותני שירות
                </h2>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setSelectedCategory(undefined)}
                  className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                    !selectedCategory
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'
                  }`}
                >
                  הכל
                </button>
                {categories.map((cat: any) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                      selectedCategory === cat.value
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {providersLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse">
                      <div className="h-5 w-32 bg-white/10 rounded mb-3" />
                      <div className="h-4 w-48 bg-white/5 rounded mb-2" />
                      <div className="h-3 w-24 bg-white/5 rounded" />
                    </div>
                  ))}
                </div>
              ) : providers.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase size={48} className="mx-auto text-white/30 mb-4" />
                  <p className="text-white/70">אין נותני שירות בקטגוריה זו</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {providers.map((provider: any, index: number) => (
                    <motion.div
                      key={provider.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-white font-medium">{provider.name}</p>
                        {provider.isVerified && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                            מאומת
                          </span>
                        )}
                      </div>
                      <p className="text-white/50 text-xs mb-2">
                        {CATEGORY_LABELS[provider.category] || provider.category}
                      </p>
                      {provider.description && (
                        <p className="text-white/60 text-sm mb-3">{provider.description}</p>
                      )}
                      <div className="space-y-1.5">
                        {provider.phone && (
                          <a
                            href={`tel:${provider.phone}`}
                            className="flex items-center gap-2 text-sm text-white/60 hover:text-emerald-400 transition-colors"
                          >
                            <Phone size={14} /> {provider.phone}
                          </a>
                        )}
                        {provider.email && (
                          <a
                            href={`mailto:${provider.email}`}
                            className="flex items-center gap-2 text-sm text-white/60 hover:text-emerald-400 transition-colors"
                          >
                            <Mail size={14} /> {provider.email}
                          </a>
                        )}
                        {provider.website && (
                          <a
                            href={provider.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-white/60 hover:text-emerald-400 transition-colors"
                          >
                            <Globe size={14} /> אתר
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
