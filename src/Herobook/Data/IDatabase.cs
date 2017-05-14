using System.Collections.Generic;
using Herobook.Data.Entities;

namespace Herobook.Data {
    public interface IDatabase {
        IEnumerable<Profile> ListProfiles();
        int CountProfiles();
        void CreateProfile(Profile profile);
        Profile FindProfile(string username);
        IEnumerable<Profile> LoadFriends(string username);
        void CreateFriendship(string username1, string username2);
        void DeleteProfile(string username);
        Profile UpdateProfile(string username, Profile profile);
    }
}
