main();

async function main() {
  const tempDisplay = document.querySelector("#temp");
  const bendDisplay = document.querySelector("#bend");
  const huggedDisplay = document.querySelector("#hugged");

  const gpioAccess = await navigator.requestGPIOAccess();
  const buttonPort = gpioAccess.ports.get(5);
  await buttonPort.export("in");
  const relayPort = gpioAccess.ports.get(26);
  await relayPort.export("out");

  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const sht30 = new SHT30(port, 0x44);
  await sht30.init();
  const ads1015 = new ADS1015(port, 0x48);
  await ads1015.init();
  
  const BEND_HUGGED = 1150;
  const TEMP_STANDBY = 30;
  const TEMP_MAX = 50;
  
  let hugged = false;
  while (true) {
    try {
      let bendVal = await ads1015.read(0);
      hugged = BEND_HUGGED < bendVal;

      bendDisplay.innerHTML = bendVal;
    } catch (error) {
      if (error.code != 4) bendDisplay.innerHTML = "ERROR";
      console.log(`[error] code:${error.code} message:${error.message}`);
    }
    
    const {temperature: temp} = await sht30.readData();
    tempDisplay.innerHTML = temp;
    
    let heat = hugged;
    huggedDisplay.innerHTML = hugged ? "HUGGED" : "RELEASED";
    if (temp < TEMP_STANDBY) {
      heat = true;
    } else if (TEMP_MAX < temp) {
      heat = false;
    }
    relayPort.write(heat ? 0 : 1);

    await sleep(500);
  }
}
