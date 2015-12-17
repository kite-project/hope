# Fake build hooks for b2gdroid
clean:
	echo "Doing nothing"

.PHONY: profile
profile:
	zip -r -9 profile/webapps/system.gaiamobile.org/application.zip assets bower_components css index.html js manifest.webapp
