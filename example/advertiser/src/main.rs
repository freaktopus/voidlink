use btleplug::api::{bleuuid::BleUuid, Central, Manager as _};
use btleplug::api::{CentralEvent, CentralState, Peripheral, ScanFilter};
use btleplug::platform::Manager;
use futures::stream::StreamExt;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let manager = Manager::new().await?;
    let adapters = manager.adapters().await?;
    let central = adapters.into_iter().next();
    if let Some(c) = central {
        println!("Scanning!!");
        let state = c.adapter_state().await?;
        if state != CentralState::PoweredOn {
            println!("Turn on the BLE device and run again!");
            return Ok(());
        }
        c.start_scan(ScanFilter::default()).await?;
        let mut events = c.events().await?;

        // Print based on whatever the event receiver outputs. Note that the event
        // receiver blocks, so in a real program, this should be run in its own
        // thread (not task, as this library does not yet use async channels).
        while let Some(event) = events.next().await {
            match event {
                CentralEvent::DeviceDiscovered(id) => {
                    let peripheral = c.peripheral(&id).await?;
                    let properties = peripheral.properties().await?;
                    let name = properties
                        .and_then(|p| p.local_name)
                        .map(|local_name| format!("Name: {local_name}"))
                        .unwrap_or_default();
                    // println!("DeviceDiscovered: {:?} {}", id, name);
                }
                CentralEvent::StateUpdate(state) => {
                    // println!("AdapterStatusUpdate {:?}", state);
                }
                CentralEvent::DeviceConnected(id) => {
                    // println!("DeviceConnected: {:?}", id);
                }
                CentralEvent::DeviceDisconnected(id) => {
                    // println!("DeviceDisconnected: {:?}", id);
                }
                CentralEvent::ManufacturerDataAdvertisement {
                    id,
                    manufacturer_data,
                } => {
                    // println!(
                    //     "ManufacturerDataAdvertisement: {:?}, {:?}",
                    //     id, manufacturer_data
                    // );
                }
                CentralEvent::ServiceDataAdvertisement { id, service_data } => {
                    println!("ServiceDataAdvertisement: {:?}, {:?}", id, service_data);
                }
                CentralEvent::ServicesAdvertisement { id, services } => {
                    let services: Vec<String> =
                        services.into_iter().map(|s| s.to_short_string()).collect();
                    println!("ServicesAdvertisement: {:?}, {:?}", id, services);
                }
                _ => {}
            }
        }
        println!("Scan Complete!!");
    }

    Ok(())
}
