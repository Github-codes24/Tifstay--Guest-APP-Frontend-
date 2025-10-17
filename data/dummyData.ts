export const tiffinData = [
    {
      id: 1,
      title: "Maharashtrian Ghar Ka Khana",
      type: "tiffin",
      rating: 4.7,
      reviews: 156,
      images: [
        "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500&q=80",
        "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80",
        "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80"
      ],
      description: "Authentic Maharashtrian home-style cooking with fresh ingredients. Our tiffin service has been serving the Nagpur community for over 5 years with traditional recipes passed down through generations.",
      features: ["Vegetarian", "7:00 AM - 10:00 PM"],
      withOneMeal: {
        veg: {
          dining: ["Dining ₹120/day", "Dining ₹3500/month", "Dining ₹250/week"],
          delivery: ["Delivery ₹150/day", "Delivery ₹4500/month", "Delivery ₹350/week"]
        }
      },
      mealPreference: {
        breakfast: "7:00 AM - 9:00 AM",
        lunch: "12:00 PM - 2:00 PM",
        dinner: "6:30 PM - 10:00 PM"
      },
      whatsIncluded: [
        "Rice + Sabzi + Dal + Roti + Pickle",
        "Sweet dish on weekends",
        "Fresh chapati made daily",
        "Traditional spices"
      ],
      orderTypes: [
        { type: "Subscription", available: true },
        { type: "Delivery", available: true }
      ],
      whyChooseUs: [
        "Fresh ingredients daily",
        "Hygienic preparation",
        "On-time delivery",
        "Monthly menu rotation",
        "Hygienic preparation",
        "Monthly subscription available"
      ],
      location: {
        name: "Near Medical College",
        address: "123 Green Valley Road, Dharampeth, Nagpur - 440010",
        serviceRadius: "5 sq km"
      },
      reviewsData: [
        {
          id: 1,
          name: "Autumn Phillips",
          date: "Monday, June 16, 2025",
          rating: 5,
          review: "I've been using this tiffin service for over a month now and the food quality is consistently great. Fresh ingredients, good packaging, and always on time. It's honestly feels like eating from home!"
        },
        {
          id: 2,
          name: "Rhonda Rhodes",
          date: "Wednesday, March 12, 2025",
          rating: 4,
          review: "What I love the most is the cleanliness and hygiene. Plus, I can taste my orders and choose between lunch or dinner slots easily. Highly recommended."
        },
        {
          id: 3,
          name: "Patricia Sanders",
          date: "Friday, April 11, 2025",
          rating: 5,
          review: "I stay in a hostel and don't have time to cook – this service has been a lifesaver. The lunch is always warm and delivered on time. Customer support is also responsive."
        }
      ]
    }
  ];
  
  export const hostelData = [
    {
      id: 1,
      title: "Scholars Den Boys Hostel",
      type: "hostel",
      rating: 4.7,
      reviews: 52,
      tags: ["Boys Hostel", "Dharampeth"],
      images: [
        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500&q=80",
        "https://images.unsplash.com/photo-1574643156929-51fa098b0394?w=500&q=80",
        "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=500&q=80"
      ],
      description: "A well-maintained boys hostel with all modern amenities. Located in a prime area with easy access to colleges and hospitals. Safe and secure environment with 24/7 security.",
      price: "₹8000/month",
      priceNote: "Note: You have to pay security deposit of ₹15,000 on monthly booking. It will be refunded to you on check-out.",
      totalRooms: 8,
      availableRooms: 3,
      facilities: [
        { icon: "wifi", name: "Wi-Fi", available: true },
        { icon: "tv-outline", name: "Common TV", available: true },
        { icon: "book-outline", name: "Study Hall", available: true },
        { icon: "shirt-outline", name: "Laundry", available: true }
      ],
      rulesAndPolicies: "No smoking inside premises. Visitors allowed to 8 PM. Main closing: 7: 30 AM - 10:2 PM. 7-9 PM Number breakdown in common areas.",
      location: {
        name: "Near Medical College",
        address: "123, Green Valley Road, Dharampeth, Nagpur - 440010"
      },
      reviewsData: [
        {
          id: 1,
          name: "Autumn Phillips",
          date: "Monday, June 16, 2025",
          rating: 5,
          review: "I stayed for 2 weeks—home away comfort, Wi-Fi was responsive, and Wi-Fi was fast. Highly recommend for students!"
        },
        {
          id: 2,
          name: "Rhonda Rhodes",
          date: "Wednesday, March 12, 2025",
          rating: 4,
          review: "Budget-friendly with 24/7 security. Shared kitchen was a plus. Minor plumbing issue, but it was fixed quickly."
        },
        {
          id: 3,
          name: "Patricia Sanders",
          date: "Friday, April 11, 2025",
          rating: 5,
          review: "A cozy living space in Dharampeth. Lots of food options nearby and peaceful environment for studying."
        }
      ]
    }
  ];