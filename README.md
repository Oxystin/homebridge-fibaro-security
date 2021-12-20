# homebridge-fibaro-security
Homebridge plugin that creates SecuritySystem for Fibaro device. The plugin only changes the state of the Fibaro global variable (name_var) depending on the selected SecuritySystem state:

- **"0"**: HOME
- **"1"**: AWAY
- **"2"**: NIGHT
- **"3"**: OFF
- **"4"**: ALARM

**IMPORTANT:** This plugin only changes the Fibaro global variable. All other logic must be implemented on Fibaro itself using scenes.

## Installation

    npm install --save https://github.com/Oxystin/homebridge-fibaro-security.git

## Configuration
Configuration example:

```
    "accessories": [
        {
            "accessory": "Homebridge-Fibaro-Security",
            "name": "Home security",
            "login": "login",
            "password": "password",
            "ip": "192.168.1.45",
            "name_var": "secure",
            "pollerperiod": 10000
        }
    ],

```

- **name** - parameter determines the name of the security system you will see in HomeKit.
- **login/password** - login and password from Fibaro. 
- **ip** - Fibaro's ip address.
- **name_var** - global variable Fibaro (must first be created).
- **pollerperiod** - is a number which defines the poll interval in milliseconds. Defaults to 0.
