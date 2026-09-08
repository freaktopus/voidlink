use bluer::{adv::Advertisement, Session, Uuid};
use std::collections::{BTreeMap, BTreeSet};
use tokio::signal;

const SERVICE_UUID_STR: &str = "12345678-9abc-def0-1234-56789abcdef0";

#[tokio::main]
async fn main() -> bluer::Result<()> {
    let session = Session::new().await?;
    let adapter = session.default_adapter().await?;
    adapter.set_powered(true).await?;

    let payload = b"Hello".to_vec();

    let service_uuid: Uuid = SERVICE_UUID_STR.parse().unwrap();

    let mut service_uuids = BTreeSet::new();
    service_uuids.insert(service_uuid);

    let mut service_data = BTreeMap::new();
    service_data.insert(service_uuid, payload);

    let adv = Advertisement {
        advertisement_type: bluer::adv::Type::Peripheral,
        local_name: Some("HelloDevice".to_string()),
        service_uuids,
        service_data,
        discoverable: Some(true),
        ..Default::default()
    };

    let _handle = adapter.advertise(adv).await?;
    println!("Advertising 'Hello'. Press Ctrl+C to stop.");
    signal::ctrl_c().await?;
    Ok(())
}
