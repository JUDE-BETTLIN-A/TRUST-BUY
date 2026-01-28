"use client";

import { useEffect } from "react";
import { refreshAlerts, removeAlert } from "@/app/alerts/actions";

export function AlertManager() {
  useEffect(() => {
    // Request notification permission on mount
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    // Function to check for alerts
    const checkAlerts = async () => {
      if (document.hidden) return; // Optional: Optimize by only checking when tab is visible? 
      // Actually user wants background notifications for "web notification", so we should check regardless.

      try {
        console.log("Checking price alerts...");
        const result = await refreshAlerts();
        
        if (result.success && result.droppedProducts && result.droppedProducts.length > 0) {
          result.droppedProducts.forEach(async (product: any) => {
            // Send Notification
            if ("Notification" in window && Notification.permission === "granted") {
                const notif = new Notification("Price Drop Alert! 📉", {
                  body: `${product.title} has dropped to ₹${product.newPrice}!`,
                  icon: product.image || "/icon.png",
                  tag: `price-drop-${product.id}` // Prevent massive duplicates
                });
                
                notif.onclick = (e) => {
                  e.preventDefault();
                  if (product.link && product.link !== '#') {
                      window.open(product.link, '_blank');
                  }
                  notif.close();
                };
            }

            // Remove the alert as requested ("remove target price")
            await removeAlert(product.id);
            console.log(`Alert removed for ${product.title}`);
          });
        }
      } catch (error) {
        // Suppress "Failed to fetch" errors which happen when server/network is down
        if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
            console.warn("Could not check alerts: Server unreachable");
            return;
        }
        console.error("Error checking alerts:", error);
      }
    };

    // Initial check (optional, maybe delay a bit)
    // checkAlerts(); 

    // Set interval for 5 minutes (300,000 ms)
    const intervalId = setInterval(checkAlerts, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  return null; // This component handles logic only, no UI
}
