const fs = require('fs');
const path = require('path');

// Files that need BASE_URL import added and URLs replaced
const filesToUpdate = [
  'app/(auth)/PersonalDetailsScreen.tsx',
  'app/(auth)/register.tsx',
  'app/(secure)/(tabs)/account.tsx',
  'app/(secure)/(tabs)/booking.tsx',
  'app/(secure)/(tabs)/favorite.tsx',
  'app/(secure)/(tabs)/notification.tsx',
  'app/(secure)/account/addAddress.tsx',
  'app/(secure)/account/addmoney.tsx',
  'app/(secure)/account/address.tsx',
  'app/(secure)/account/AllTransactionsScreen.tsx',
  'app/(secure)/account/chatScreen.tsx',
  'app/(secure)/account/deleteAccount.tsx',
  'app/(secure)/account/deposite.tsx',
  'app/(secure)/account/depositmoney.tsx',
  'app/(secure)/account/editProfile.tsx',
  'app/(secure)/account/privacyPolicy.tsx',
  'app/(secure)/account/profile.tsx',
  'app/(secure)/account/RateNowScreen.tsx',
  'app/(secure)/account/refer.tsx',
  'app/(secure)/account/termsCondition.tsx',
  'app/(secure)/account/TransactionDetailsScreen.tsx',
  'app/(secure)/account/wallet.tsx',
  'app/(secure)/account/WalletTransactionsScreen.tsx',
  'app/(secure)/account/withdraw.tsx',
  'app/(secure)/account/[addressId].tsx',
  'app/(secure)/hostel-details/[id].tsx',
  'app/(secure)/tiffin-details/[id].tsx',
  'app/(secure)/tiffin-order-details/[id].tsx',
  'app/(secure)/bookingScreen.tsx',
  'app/(secure)/Cartscreen.tsx',
  'app/(secure)/check-out.tsx',
  'app/(secure)/Confirmation.tsx',
  'app/(secure)/continueSubscriptionScreen.tsx',
  'app/(secure)/payment.tsx',
  'components/modals/FilterModal.tsx',
  'components/modals/LocationModal.tsx',
  'components/modals/RoomSelectionModal.tsx',
  'components/modals/TrackOrderModal.tsx',
  'context/FavoritesContext.tsx',
];

filesToUpdate.forEach((file) => {
  const fullPath = path.join(__dirname, file);
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Check if file already has BASE_URL import
    if (!content.includes('import { BASE_URL } from "@/constants/api"')) {
      // Find import section and add BASE_URL import
      const importRegex = /(import\s+.*?\s+from\s+["']@\/.*?["'];?)/s;
      const lastImportRegex = /(import\s+.*?\s+from\s+["'].*?["'];)\s*\n/;
      
      if (lastImportRegex.test(content)) {
        content = content.replace(lastImportRegex, (match) => {
          return match + 'import { BASE_URL } from "@/constants/api";\n';
        });
        modified = true;
      }
    }

    // Replace all hardcoded URLs with BASE_URL
    const urlPattern = /https:\/\/tifstay-project-be\.onrender\.com/g;
    if (urlPattern.test(content)) {
      content = content.replace(urlPattern, '${BASE_URL}');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✓ Updated: ${file}`);
    }
  } catch (error) {
    console.error(`✗ Error updating ${file}:`, error.message);
  }
});

console.log('Done!');
