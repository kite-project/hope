# Fake build hooks for b2gdroid
clean:
	echo "Doing nothing"

.PHONY: profile
profile:
	zip -r -9 profile/webapps/system.gaiamobile.org/application.zip assets index.html lib node_modules js manifest.webapp

addon:
	zip addon.zip addon.js manifest.json assets index.html lib node_modules
