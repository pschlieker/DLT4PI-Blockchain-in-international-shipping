#!/bin/bash

# this script deletes any orphaned keys in /tmp from previous enrollments
# and attempts to enroll/register new users.
# CAUTION: will not work twice in a row, as it will delete your keys but not
# re-register the users!

rm -R /tmp/hfc-*
rm -R ./dma
rm -R ./vta
node enrollAndRegisterDma.js
node enrollAndRegisterVta.js
