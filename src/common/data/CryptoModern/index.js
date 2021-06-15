/* ------------------------------------ */
// Navbar data section
/* ------------------------------------ */
import logo from 'common/assets/image/cryptoModern/logo.png';

/* ------------------------------------ */
// Features data section
/* ------------------------------------ */
import featureIcon1 from 'common/assets/image/utoptia/Utopia_dark_circle.png';
import featureIcon2 from 'common/assets/image/utoptia/Utopia_simple_dark_circle.png';

/* ------------------------------------ */
// Wallet  data section
/* ------------------------------------ */
import walletIcon1 from 'common/assets/image/cryptoModern/wallet1.png';
import walletIcon2 from 'common/assets/image/cryptoModern/wallet2.png';
import walletIcon3 from 'common/assets/image/cryptoModern/wallet3.png';

export const navbar = {
  logo,
  navMenu: [
    {
      id: 1,
      label: 'WHITE PAPER',
      path: '#white-paper',
      offset: '81',
    },
  ],
};

export const MissionData = [
  {
    id: 1,
    icon: featureIcon2,
    title: 'CHARITY',
    description:
      'We seek to solve real-world problems through our charity donations/crowdfunding. We want to ensure everything we donate has the most impact per dollar.',
  },
  {
    id: 2,
    icon: featureIcon2,
    title: 'EQUALITY',
    description:
      'The whole philosophy of Utopia is equality and fairness. We represent this through our anti-bot and anti-whale features. We intend to take a stand against unfairness in the the DeFi space.',
  },
  {
    id: 3,
    icon: featureIcon2,
    title: 'COMMUNITY',
    description:
      'Built by and for the community, we strive to get close to achieving a perfect world with the empowerment and support of our community.',
  },
];

export const TokenomicsData = [
  {
    id: 1,
    title: 'Total Supply',
    value: '1,000,000,000,000',
  },
  {
    id: 2,
    title: 'Presale',
    value: '400,000,000,000',
  },
  {
    id: 3,
    title: 'Pancakeswap Liquidity',
    value: '400,000,000,000',
  },
  {
    id: 4,
    title: 'Team',
    value: '42,000,000,000',
    description:
      'Locked and will be slowly released',
  },
  {
    id: 5,
    title: 'Locked Tokens',
    value: '158,000,000,000',
    description:
      'These tokens will primarily be used to provide liquidity to centralised exchanges for new listings and a store of value for the business as an asset',
  },
];

export const TokenomicsTaxHightlights = [
  {
    id: 1,
    title: '10%',
    description: 'tax applied on each transaction',
  },
  {
    id: 2,
    title: '5%',
    description: 'goes to existing holders allowing them to passively earn',
  },
  {
    id: 3,
    title: '5%',
    description: 'goes towards token stability and charity',
  },
];

export const TokenomicsWhaleHightlights = [
  {
    id: 1,
    title: 'Higher tax',
    description: 'for larger transactions',
  },
  {
    id: 2,
    title: 'Max amount of transactions',
    description: 'set to 0.2%',
  },
  {
    id: 3,
    title: 'Max cap per wallet',
    description: 'set to 0,7%',
  },
];

export const WalletFeatures = [
  {
    id: 1,
    icon: walletIcon1,
    title: 'Secure transfers with verified Casinos.',
  },
  {
    id: 2,
    icon: walletIcon2,
    title: 'Easily buy and sell CLV within the wallet',
  },
  {
    id: 3,
    icon: walletIcon3,
    title: 'Pay as many as you want',
  },
];

/* ------------------------------------ */
// Faq  data section
/* ------------------------------------ */

export const Faq = [
  {
    id: 1,
    expend: true,
    title: 'How to contact with Customer Service?',
    description:
      'Our Customer Experience Team is available 7 days a week and we offer 2 ways to get in contact.Email and Chat . We try to reply quickly, so you need not to wait too long for a response!. ',
  },
  {
    id: 2,
    title: 'App installation failed, how to update system information?',
    description:
      'Please read the documentation carefully . We also have some online  video tutorials regarding this issue . If the problem remains, Please Open a ticket in the support forum . ',
  },
  {
    id: 3,
    title: 'Website reponse taking time, how to improve?',
    description:
      'At first, Please check your internet connection . We also have some online  video tutorials regarding this issue . If the problem remains, Please Open a ticket in the support forum .',
  },
  {
    id: 4,
    title: 'New update fixed all bug and issues?',
    description:
      'We are giving the update of this theme continuously . You will receive an email Notification when we push an update. Always try to be updated with us .',
  },
];

/* ------------------------------------ */
// Footer data section
/* ------------------------------------ */
export const FooterData = [
  {
    title: 'About Us',
    menuItems: [
      {
        id: 1,
        url: '#',
        text: 'Support Center',
      },
      {
        id: 2,
        url: '#',
        text: 'Customer Support',
      },
      {
        id: 3,
        url: '#',
        text: 'About Us',
      },
      {
        id: 4,
        url: '#',
        text: 'Copyright',
      },
      {
        id: 5,
        url: '#',
        text: 'Popular Campaign',
      },
    ],
  },
  {
    title: 'Our Information',
    menuItems: [
      {
        id: 1,
        url: '#',
        text: 'Return Policy',
      },
      {
        id: 2,
        url: '#',
        text: 'Privacy Policy',
      },
      {
        id: 3,
        url: '#',
        text: 'Terms & Conditions',
      },
      {
        id: 4,
        url: '#',
        text: 'Site Map',
      },
      {
        id: 5,
        url: '#',
        text: 'Store Hours',
      },
    ],
  },
  {
    title: 'My Account',
    menuItems: [
      {
        id: 1,
        url: '#',
        text: 'Press inquiries',
      },
      {
        id: 2,
        url: '#',
        text: 'Social media directories',
      },
      {
        id: 3,
        url: '#',
        text: 'Images & B-roll',
      },
      {
        id: 4,
        url: '#',
        text: 'Permissions',
      },
      {
        id: 5,
        url: '#',
        text: 'Speaker requests',
      },
    ],
  },
  {
    title: 'Policy',
    menuItems: [
      {
        id: 1,
        url: '#',
        text: 'Application security',
      },
      {
        id: 2,
        url: '#',
        text: 'Software principles',
      },
      {
        id: 3,
        url: '#',
        text: 'Unwanted software policy',
      },
      {
        id: 4,
        url: '#',
        text: 'Responsible supply chain',
      },
    ],
  },
];
